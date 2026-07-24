import { prisma } from "@/lib/db";
import { num } from "@/lib/utils";
import { label } from "@/lib/enums";
import { lastNMonths } from "@/lib/dates";
import { capRate as calcCapRate, noi as calcNoi } from "@/lib/metrics";
import type { Prisma } from "@prisma/client";

const ACTIVE_LEASE = ["ACTIVE", "EXPIRING_SOON", "MONTH_TO_MONTH"] as const;
// Operating expenses exclude debt service & capital improvements (NOI definition).
const NON_OPERATING = new Set(["MORTGAGE_INTEREST", "CAPITAL_IMPROVEMENT"]);

function yearRange(period?: string) {
  const year =
    period && /^\d{4}$/.test(period) ? Number(period) : new Date().getFullYear();
  return {
    year,
    start: new Date(year, 0, 1, 0, 0, 0, 0),
    end: new Date(year, 11, 31, 23, 59, 59, 999),
    label: String(year),
  };
}

// Charge with allocations + payment void flag, for paid/balance math.
type ChargeWithPaid = Prisma.ChargeGetPayload<{
  include: { allocations: { include: { payment: { select: { voidedAt: true } } } } };
}>;

function paidOf(charge: ChargeWithPaid): number {
  return charge.allocations.reduce(
    (s, a) => s + (a.payment && !a.payment.voidedAt ? num(a.amount) : 0),
    0,
  );
}

// ─────────────────────────────────────────────────────────────
// Light index for the reports landing header.
// ─────────────────────────────────────────────────────────────
export async function getReportsSummary() {
  const [properties, activeLeases, openCharges] = await Promise.all([
    prisma.property.count({ where: { deletedAt: null } }),
    prisma.lease.findMany({
      where: { deletedAt: null, status: { in: [...ACTIVE_LEASE] } },
      select: { rent: true },
    }),
    prisma.charge.findMany({
      where: { voidedAt: null, status: { in: ["UNPAID", "PARTIAL", "LATE"] } },
      include: { allocations: { include: { payment: { select: { voidedAt: true } } } } },
    }),
  ]);
  const monthlyRent = activeLeases.reduce((s, l) => s + num(l.rent), 0);
  const openBalance = openCharges.reduce(
    (s, c) => s + Math.max(0, num(c.amount) - paidOf(c)),
    0,
  );
  return {
    properties,
    activeLeases: activeLeases.length,
    monthlyRent,
    openBalance,
  };
}

// ─────────────────────────────────────────────────────────────
// Rent Roll
// ─────────────────────────────────────────────────────────────
export async function rentRollReport() {
  const leases = await prisma.lease.findMany({
    where: { deletedAt: null, status: { in: [...ACTIVE_LEASE] } },
    include: {
      property: { select: { name: true } },
      unit: { select: { number: true } },
      tenants: {
        include: { tenant: { select: { firstName: true, lastName: true } } },
        orderBy: { isPrimary: "desc" },
      },
      charges: {
        where: { voidedAt: null },
        include: { allocations: { include: { payment: { select: { voidedAt: true } } } } },
      },
    },
    orderBy: [{ property: { name: "asc" } }, { unit: { number: "asc" } }],
  });

  const rows = leases.map((l) => {
    const billed = l.charges.reduce((s, c) => s + num(c.amount), 0);
    const paid = l.charges.reduce((s, c) => s + paidOf(c), 0);
    const primary = l.tenants[0]?.tenant;
    return {
      id: l.id,
      property: l.property.name,
      unit: l.unit.number,
      tenant: primary ? `${primary.firstName} ${primary.lastName}` : "—",
      rent: num(l.rent),
      paid,
      balance: Math.max(0, billed - paid),
      status: l.status,
    };
  });

  return {
    rows,
    totals: {
      rent: rows.reduce((s, r) => s + r.rent, 0),
      paid: rows.reduce((s, r) => s + r.paid, 0),
      balance: rows.reduce((s, r) => s + r.balance, 0),
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Income Statement (accrual — billed income vs. expenses by category)
// ─────────────────────────────────────────────────────────────
export async function incomeStatementReport(period?: string) {
  const { start, end, label: periodLabel } = yearRange(period);

  const [charges, expenses] = await Promise.all([
    prisma.charge.groupBy({
      by: ["type"],
      where: { voidedAt: null, dueDate: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ["category"],
      where: { voidedAt: null, date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
  ]);

  const income = charges
    .map((c) => ({ key: c.type, label: label(c.type), amount: num(c._sum.amount) }))
    .filter((r) => r.amount !== 0)
    .sort((a, b) => b.amount - a.amount);

  const expenseLines = expenses
    .map((e) => ({
      key: e.category,
      label: label(e.category),
      amount: num(e._sum.amount),
      operating: !NON_OPERATING.has(e.category),
    }))
    .filter((r) => r.amount !== 0)
    .sort((a, b) => b.amount - a.amount);

  const totalIncome = income.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = expenseLines.reduce((s, r) => s + r.amount, 0);
  const operatingExpenses = expenseLines
    .filter((r) => r.operating)
    .reduce((s, r) => s + r.amount, 0);

  return {
    period: periodLabel,
    income,
    expenses: expenseLines,
    totalIncome,
    totalExpenses,
    operatingExpenses,
    noi: calcNoi(totalIncome, operatingExpenses),
    netIncome: totalIncome - totalExpenses,
  };
}

// ─────────────────────────────────────────────────────────────
// Cash Flow (12 months, cash basis)
// ─────────────────────────────────────────────────────────────
export async function cashFlowReport() {
  const buckets = lastNMonths(12);
  const start = buckets[0].start;
  const end = buckets[buckets.length - 1].end;

  const [payments, expenses] = await Promise.all([
    prisma.payment.findMany({
      where: { voidedAt: null, receivedOn: { gte: start, lte: end } },
      select: { amount: true, receivedOn: true },
    }),
    prisma.expense.findMany({
      where: { voidedAt: null, date: { gte: start, lte: end } },
      select: { amount: true, date: true },
    }),
  ]);

  const rows = buckets.map((b) => {
    const income = payments
      .filter((p) => p.receivedOn >= b.start && p.receivedOn <= b.end)
      .reduce((s, p) => s + num(p.amount), 0);
    const expense = expenses
      .filter((e) => e.date >= b.start && e.date <= b.end)
      .reduce((s, e) => s + num(e.amount), 0);
    return { month: b.label, income, expenses: expense, net: income - expense };
  });

  return {
    rows,
    totals: {
      income: rows.reduce((s, r) => s + r.income, 0),
      expenses: rows.reduce((s, r) => s + r.expenses, 0),
      net: rows.reduce((s, r) => s + r.net, 0),
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Delinquency
// ─────────────────────────────────────────────────────────────
export async function delinquencyReport() {
  const now = new Date();
  const charges = await prisma.charge.findMany({
    where: {
      voidedAt: null,
      status: { in: ["UNPAID", "PARTIAL", "LATE"] },
      dueDate: { lt: now },
    },
    include: {
      allocations: { include: { payment: { select: { voidedAt: true } } } },
      lease: {
        select: {
          id: true,
          property: { select: { name: true } },
          unit: { select: { number: true } },
          tenants: {
            include: { tenant: { select: { firstName: true, lastName: true } } },
            orderBy: { isPrimary: "desc" },
          },
        },
      },
    },
  });

  const byLease = new Map<
    string,
    {
      id: string;
      tenant: string;
      property: string;
      unit: string;
      amount: number;
      oldestDue: Date;
    }
  >();

  for (const c of charges) {
    const outstanding = Math.max(0, num(c.amount) - paidOf(c));
    if (outstanding <= 0) continue;
    const key = c.lease.id;
    const primary = c.lease.tenants[0]?.tenant;
    const existing = byLease.get(key);
    if (existing) {
      existing.amount += outstanding;
      if (c.dueDate < existing.oldestDue) existing.oldestDue = c.dueDate;
    } else {
      byLease.set(key, {
        id: key,
        tenant: primary ? `${primary.firstName} ${primary.lastName}` : "—",
        property: c.lease.property.name,
        unit: c.lease.unit.number,
        amount: outstanding,
        oldestDue: c.dueDate,
      });
    }
  }

  const rows = [...byLease.values()]
    .map((r) => ({
      id: r.id,
      tenant: r.tenant,
      property: r.property,
      unit: r.unit,
      amount: r.amount,
      daysLate: Math.max(0, Math.round((now.getTime() - r.oldestDue.getTime()) / 86400000)),
    }))
    .sort((a, b) => b.daysLate - a.daysLate);

  return {
    rows,
    totals: { amount: rows.reduce((s, r) => s + r.amount, 0), count: rows.length },
  };
}

// ─────────────────────────────────────────────────────────────
// Lease Expiration
// ─────────────────────────────────────────────────────────────
export async function leaseExpirationReport() {
  const leases = await prisma.lease.findMany({
    where: { deletedAt: null, status: { in: [...ACTIVE_LEASE] } },
    include: {
      property: { select: { name: true } },
      unit: { select: { number: true } },
      tenants: {
        include: { tenant: { select: { firstName: true, lastName: true } } },
        orderBy: { isPrimary: "desc" },
      },
    },
    orderBy: { endDate: "asc" },
  });

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const rows = leases.map((l) => {
    const end = new Date(l.endDate);
    end.setHours(0, 0, 0, 0);
    const days = Math.round((end.getTime() - now.getTime()) / 86400000);
    const bucket =
      days < 0 ? "Expired" : days <= 30 ? "Critical" : days <= 60 ? "Soon" : days <= 90 ? "Upcoming" : "Future";
    const primary = l.tenants[0]?.tenant;
    return {
      id: l.id,
      property: l.property.name,
      unit: l.unit.number,
      tenant: primary ? `${primary.firstName} ${primary.lastName}` : "—",
      rent: num(l.rent),
      endDate: l.endDate.toISOString(),
      daysUntil: days,
      bucket,
      status: l.status,
    };
  });

  return {
    rows,
    totals: {
      count: rows.length,
      expiringSoon: rows.filter((r) => r.daysUntil >= 0 && r.daysUntil <= 90).length,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Occupancy
// ─────────────────────────────────────────────────────────────
export async function occupancyReport() {
  const properties = await prisma.property.findMany({
    where: { deletedAt: null },
    include: { units: { where: { deletedAt: null }, select: { status: true } } },
    orderBy: { name: "asc" },
  });

  const rows = properties
    .map((p) => {
      const units = p.units.length;
      const occupied = p.units.filter((u) => u.status === "OCCUPIED").length;
      const vacant = units - occupied;
      return {
        id: p.id,
        property: p.name,
        units,
        occupied,
        vacant,
        occupancy: units ? (occupied / units) * 100 : 0,
      };
    })
    .filter((r) => r.units > 0);

  const totalUnits = rows.reduce((s, r) => s + r.units, 0);
  const totalOccupied = rows.reduce((s, r) => s + r.occupied, 0);

  return {
    rows,
    totals: {
      units: totalUnits,
      occupied: totalOccupied,
      vacant: totalUnits - totalOccupied,
      occupancy: totalUnits ? (totalOccupied / totalUnits) * 100 : 0,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Maintenance Cost (per property)
// ─────────────────────────────────────────────────────────────
export async function maintenanceCostReport() {
  const requests = await prisma.maintenanceRequest.findMany({
    where: { deletedAt: null },
    select: {
      actualCost: true,
      estimatedCost: true,
      property: { select: { id: true, name: true } },
    },
  });

  const byProperty = new Map<string, { property: string; count: number; total: number }>();
  for (const r of requests) {
    const key = r.property.id;
    const cost = num(r.actualCost) || num(r.estimatedCost);
    const existing = byProperty.get(key);
    if (existing) {
      existing.count += 1;
      existing.total += cost;
    } else {
      byProperty.set(key, { property: r.property.name, count: 1, total: cost });
    }
  }

  const rows = [...byProperty.entries()]
    .map(([id, v]) => ({ id, ...v, avg: v.count ? v.total / v.count : 0 }))
    .sort((a, b) => b.total - a.total);

  return {
    rows,
    totals: {
      count: rows.reduce((s, r) => s + r.count, 0),
      total: rows.reduce((s, r) => s + r.total, 0),
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Vendor Spend
// ─────────────────────────────────────────────────────────────
export async function vendorSpendReport() {
  const vendors = await prisma.vendor.findMany({
    where: { deletedAt: null },
    include: {
      _count: { select: { maintenanceRequests: true } },
      expenses: { where: { voidedAt: null }, select: { amount: true } },
    },
    orderBy: { companyName: "asc" },
  });

  const rows = vendors
    .map((v) => {
      const spend = v.expenses.reduce((s, e) => s + num(e.amount), 0);
      const jobs = v._count.maintenanceRequests;
      return {
        id: v.id,
        vendor: v.companyName,
        category: v.category,
        jobs,
        spend,
        avg: jobs ? spend / jobs : 0,
      };
    })
    .filter((r) => r.jobs > 0 || r.spend > 0)
    .sort((a, b) => b.spend - a.spend);

  return {
    rows,
    totals: {
      jobs: rows.reduce((s, r) => s + r.jobs, 0),
      spend: rows.reduce((s, r) => s + r.spend, 0),
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Expense Report (by category)
// ─────────────────────────────────────────────────────────────
export async function expenseReport(period?: string) {
  const { start, end, label: periodLabel } = yearRange(period);
  const grouped = await prisma.expense.groupBy({
    by: ["category"],
    where: { voidedAt: null, date: { gte: start, lte: end } },
    _sum: { amount: true },
    _count: { _all: true },
  });

  const rows = grouped
    .map((g) => ({
      key: g.category,
      category: label(g.category),
      count: g._count._all,
      amount: num(g._sum.amount),
    }))
    .filter((r) => r.amount !== 0)
    .sort((a, b) => b.amount - a.amount);

  return {
    period: periodLabel,
    rows,
    totals: {
      amount: rows.reduce((s, r) => s + r.amount, 0),
      count: rows.reduce((s, r) => s + r.count, 0),
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Security Deposits
// ─────────────────────────────────────────────────────────────
export async function securityDepositReport() {
  const deposits = await prisma.securityDeposit.findMany({
    include: {
      lease: {
        select: {
          property: { select: { name: true } },
          unit: { select: { number: true } },
        },
      },
      tenant: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = deposits.map((d) => ({
    id: d.id,
    property: d.lease.property.name,
    unit: d.lease.unit.number,
    tenant: d.tenant ? `${d.tenant.firstName} ${d.tenant.lastName}` : "—",
    amount: num(d.amount),
    deductions: num(d.deductions),
    refund: num(d.refundAmount),
    status: d.status,
  }));

  const held = rows
    .filter((r) => r.status === "HELD" || r.status === "PARTIALLY_REFUNDED")
    .reduce((s, r) => s + r.amount, 0);
  const refunded = rows.reduce((s, r) => s + r.refund, 0);

  return {
    rows,
    totals: {
      amount: rows.reduce((s, r) => s + r.amount, 0),
      held,
      refunded,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Property Performance (trailing 12 months, cash basis)
// ─────────────────────────────────────────────────────────────
export async function propertyPerformanceReport() {
  const buckets = lastNMonths(12);
  const start = buckets[0].start;
  const end = buckets[buckets.length - 1].end;

  const [properties, expenses, allocations] = await Promise.all([
    prisma.property.findMany({
      where: { deletedAt: null },
      include: { mortgage: { select: { monthlyPayment: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.expense.findMany({
      where: { voidedAt: null, date: { gte: start, lte: end } },
      select: { propertyId: true, category: true, amount: true },
    }),
    prisma.paymentAllocation.findMany({
      where: {
        payment: { voidedAt: null, receivedOn: { gte: start, lte: end } },
      },
      select: {
        amount: true,
        charge: { select: { lease: { select: { propertyId: true } } } },
      },
    }),
  ]);

  const incomeByProp = new Map<string, number>();
  for (const a of allocations) {
    const pid = a.charge.lease.propertyId;
    incomeByProp.set(pid, (incomeByProp.get(pid) ?? 0) + num(a.amount));
  }

  const expByProp = new Map<string, number>();
  const opExpByProp = new Map<string, number>();
  for (const e of expenses) {
    const amt = num(e.amount);
    expByProp.set(e.propertyId, (expByProp.get(e.propertyId) ?? 0) + amt);
    if (!NON_OPERATING.has(e.category)) {
      opExpByProp.set(e.propertyId, (opExpByProp.get(e.propertyId) ?? 0) + amt);
    }
  }

  const rows = properties.map((p) => {
    const income = incomeByProp.get(p.id) ?? 0;
    const totalExp = expByProp.get(p.id) ?? 0;
    const opExp = opExpByProp.get(p.id) ?? 0;
    const noi = calcNoi(income, opExp);
    const debtService = num(p.mortgage?.monthlyPayment) * 12;
    const value = num(p.estimatedValue);
    return {
      id: p.id,
      property: p.name,
      income,
      expenses: totalExp,
      noi,
      cashFlow: noi - debtService,
      capRate: value ? calcCapRate(noi, value) : 0,
    };
  });

  return {
    rows,
    totals: {
      income: rows.reduce((s, r) => s + r.income, 0),
      expenses: rows.reduce((s, r) => s + r.expenses, 0),
      noi: rows.reduce((s, r) => s + r.noi, 0),
      cashFlow: rows.reduce((s, r) => s + r.cashFlow, 0),
    },
  };
}
