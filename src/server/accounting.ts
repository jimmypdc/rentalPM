import { prisma } from "@/lib/db";
import { num } from "@/lib/utils";
import { lastNMonths, monthKey } from "@/lib/dates";

// Read-only accounting aggregations. This is intentionally lightweight P&L /
// cash-flow reporting — not a double-entry general ledger.

export interface AccountingFilters {
  propertyId?: string;
  year?: number;
}

// Operating expenses exclude financing (mortgage interest) and capital outlays.
const NON_OPERATING = new Set(["MORTGAGE_INTEREST", "CAPITAL_IMPROVEMENT"]);

export async function getAccounting(filters: AccountingFilters = {}) {
  const { propertyId, year } = filters;

  // Period: a specific calendar year, or trailing 12 months (default).
  const anchor = year ? new Date(year, 11, 1) : new Date();
  const buckets = lastNMonths(12, anchor);
  const periodStart = buckets[0].start;
  const periodEnd = buckets[buckets.length - 1].end;
  const months = buckets.length;

  const propertyWhere = propertyId ? { id: propertyId } : { deletedAt: null };

  const [properties, payments, expenses, mortgages, distributions, depositAgg] =
    await Promise.all([
      prisma.property.findMany({
        where: propertyWhere,
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.payment.findMany({
        where: { voidedAt: null, receivedOn: { gte: periodStart, lte: periodEnd } },
        select: {
          amount: true,
          receivedOn: true,
          allocations: {
            select: {
              amount: true,
              charge: { select: { lease: { select: { propertyId: true } } } },
            },
          },
        },
      }),
      prisma.expense.findMany({
        where: {
          voidedAt: null,
          date: { gte: periodStart, lte: periodEnd },
          ...(propertyId ? { propertyId } : {}),
        },
        select: { amount: true, date: true, category: true, propertyId: true },
      }),
      prisma.mortgage.findMany({
        where: propertyId ? { propertyId } : {},
        select: { propertyId: true, monthlyPayment: true },
      }),
      prisma.ownerDistribution.findMany({
        where: {
          date: { gte: periodStart, lte: periodEnd },
          ...(propertyId ? { propertyId } : {}),
        },
        select: { amount: true },
      }),
      prisma.securityDeposit.aggregate({
        where: {
          status: { in: ["HELD", "PARTIALLY_REFUNDED"] },
          ...(propertyId ? { lease: { propertyId } } : {}),
        },
        _sum: { amount: true },
      }),
    ]);

  const propertyIds = new Set(properties.map((p) => p.id));

  // Attribute each payment: total (unfiltered) and allocation split by property.
  // When a property filter is active we count only its allocated share.
  function paymentAmount(p: (typeof payments)[number]): number {
    if (!propertyId) return num(p.amount);
    return p.allocations
      .filter((a) => a.charge.lease.propertyId === propertyId)
      .reduce((s, a) => s + num(a.amount), 0);
  }

  // Per-property allocated income (for the P&L rows).
  const incomeByProperty = new Map<string, number>();
  for (const p of payments) {
    for (const a of p.allocations) {
      const pid = a.charge.lease.propertyId;
      if (!propertyIds.has(pid)) continue;
      incomeByProperty.set(pid, (incomeByProperty.get(pid) ?? 0) + num(a.amount));
    }
  }

  // Monthly series ─ income (payments) vs operating expenses.
  const incomeByMonth = new Map<string, number>();
  const opExpenseByMonth = new Map<string, number>();
  for (const p of payments) {
    const k = monthKey(p.receivedOn);
    incomeByMonth.set(k, (incomeByMonth.get(k) ?? 0) + paymentAmount(p));
  }
  for (const e of expenses) {
    if (NON_OPERATING.has(e.category)) continue;
    const k = monthKey(e.date);
    opExpenseByMonth.set(k, (opExpenseByMonth.get(k) ?? 0) + num(e.amount));
  }
  const series = buckets.map((b) => {
    const income = Math.round(incomeByMonth.get(b.key) ?? 0);
    const expense = Math.round(opExpenseByMonth.get(b.key) ?? 0);
    return { month: b.label, income, expenses: expense, net: income - expense };
  });

  // Expense aggregations.
  let operatingExpenses = 0;
  let capEx = 0;
  const opExpenseByProperty = new Map<string, number>();
  const byCategory = new Map<string, number>();
  for (const e of expenses) {
    const amt = num(e.amount);
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + amt);
    if (e.category === "CAPITAL_IMPROVEMENT") {
      capEx += amt;
    } else if (!NON_OPERATING.has(e.category)) {
      operatingExpenses += amt;
      opExpenseByProperty.set(e.propertyId, (opExpenseByProperty.get(e.propertyId) ?? 0) + amt);
    }
  }

  const rentalIncome = payments.reduce((s, p) => s + paymentAmount(p), 0);
  const otherIncome = 0; // kept simple — non-rent income not separately tracked
  const totalIncome = rentalIncome + otherIncome;
  const noi = totalIncome - operatingExpenses;

  const debtServiceByProperty = new Map<string, number>();
  let debtService = 0;
  for (const m of mortgages) {
    const monthly = num(m.monthlyPayment);
    const total = monthly * months;
    debtService += total;
    debtServiceByProperty.set(m.propertyId, (debtServiceByProperty.get(m.propertyId) ?? 0) + total);
  }

  const cashFlow = noi - debtService;
  const ownerDistributions = distributions.reduce((s, d) => s + num(d.amount), 0);
  const securityDeposits = num(depositAgg._sum.amount);

  const expensesByCategory = Array.from(byCategory.entries())
    .map(([category, amount]) => ({ category, amount: Math.round(amount) }))
    .sort((a, b) => b.amount - a.amount);

  const propertyPnl = properties
    .map((p) => {
      const income = incomeByProperty.get(p.id) ?? 0;
      const opex = opExpenseByProperty.get(p.id) ?? 0;
      const propNoi = income - opex;
      const debt = debtServiceByProperty.get(p.id) ?? 0;
      return {
        property: p.name,
        income: Math.round(income),
        expenses: Math.round(opex),
        noi: Math.round(propNoi),
        cashFlow: Math.round(propNoi - debt),
      };
    })
    .sort((a, b) => b.income - a.income);

  return {
    period: {
      label: year ? String(year) : "Trailing 12 months",
      start: periodStart.toISOString(),
      end: periodEnd.toISOString(),
      months,
    },
    series,
    summary: {
      rentalIncome: Math.round(rentalIncome),
      otherIncome,
      totalIncome: Math.round(totalIncome),
      operatingExpenses: Math.round(operatingExpenses),
      noi: Math.round(noi),
      debtService: Math.round(debtService),
      cashFlow: Math.round(cashFlow),
      capEx: Math.round(capEx),
      ownerDistributions: Math.round(ownerDistributions),
      securityDeposits: Math.round(securityDeposits),
    },
    expensesByCategory,
    propertyPnl,
  };
}

export type AccountingData = Awaited<ReturnType<typeof getAccounting>>;

export async function getAccountingFilters() {
  const [properties, firstExpense, firstPayment] = await Promise.all([
    prisma.property.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.expense.findFirst({ orderBy: { date: "asc" }, select: { date: true } }),
    prisma.payment.findFirst({ orderBy: { receivedOn: "asc" }, select: { receivedOn: true } }),
  ]);

  const currentYear = new Date().getFullYear();
  const candidates = [firstExpense?.date, firstPayment?.receivedOn]
    .filter((d): d is Date => !!d)
    .map((d) => d.getFullYear());
  const minYear = candidates.length ? Math.min(...candidates) : currentYear;

  const years: number[] = [];
  for (let y = currentYear; y >= minYear; y--) years.push(y);

  return {
    properties: properties.map((p) => ({ value: p.id, label: p.name })),
    years,
  };
}
