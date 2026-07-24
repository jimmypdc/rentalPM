import { LeaseStatus, MaintenanceStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { num } from "@/lib/utils";
import { lastNMonths, monthKey, startOfMonth, endOfMonth, addDays } from "@/lib/dates";
import { occupancyRate, collectionRate } from "@/lib/metrics";

const ACTIVE_LEASE: LeaseStatus[] = [
  LeaseStatus.ACTIVE, LeaseStatus.EXPIRING_SOON, LeaseStatus.MONTH_TO_MONTH,
];
const OPEN_MAINT: MaintenanceStatus[] = [
  MaintenanceStatus.NEW, MaintenanceStatus.ASSIGNED, MaintenanceStatus.SCHEDULED,
  MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.WAITING_ON_PARTS,
  MaintenanceStatus.WAITING_ON_VENDOR,
];

export async function getDashboardData() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const yearStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const buckets = lastNMonths(12, now);

  const [
    propertyCount,
    units,
    activeLeases,
    monthCharges,
    payments12,
    expenses12,
    depositAgg,
    maintenance,
    expiringLeases,
    upcomingTasks,
    upcomingInspections,
    insurancePolicies,
    propertyTaxes,
    recentActivity,
    recentPayments,
  ] = await Promise.all([
    prisma.property.count({ where: { deletedAt: null } }),
    prisma.unit.findMany({ where: { deletedAt: null }, select: { status: true } }),
    prisma.lease.findMany({
      where: { deletedAt: null, status: { in: ACTIVE_LEASE } },
      select: { rent: true },
    }),
    prisma.charge.findMany({
      where: {
        type: "RENT",
        dueDate: { gte: monthStart, lte: monthEnd },
        status: { not: "VOID" },
      },
      select: { amount: true, status: true, allocations: { select: { amount: true } } },
    }),
    prisma.payment.findMany({
      where: { voidedAt: null, receivedOn: { gte: yearStart } },
      select: { amount: true, receivedOn: true },
    }),
    prisma.expense.findMany({
      where: { voidedAt: null, date: { gte: yearStart } },
      select: { amount: true, date: true, category: true },
    }),
    prisma.securityDeposit.aggregate({
      where: { status: { in: ["HELD", "PARTIALLY_REFUNDED"] } },
      _sum: { amount: true },
    }),
    prisma.maintenanceRequest.findMany({
      where: { deletedAt: null },
      select: { status: true, priority: true },
    }),
    prisma.lease.findMany({
      where: {
        deletedAt: null,
        endDate: { gte: now, lte: addDays(now, 120) },
        status: { in: ["ACTIVE", "EXPIRING_SOON"] },
      },
      select: {
        id: true, endDate: true, rent: true,
        property: { select: { name: true } },
        unit: { select: { number: true } },
        tenants: { select: { tenant: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { endDate: "asc" },
      take: 8,
    }),
    prisma.task.findMany({
      where: { deletedAt: null, status: { not: "COMPLETED" } },
      select: { id: true, title: true, dueDate: true, priority: true, status: true },
      orderBy: { dueDate: "asc" },
      take: 8,
    }),
    prisma.inspection.findMany({
      where: { deletedAt: null, nextInspectionDate: { gte: now, lte: addDays(now, 90) } },
      select: {
        id: true, nextInspectionDate: true, type: true,
        property: { select: { name: true } },
      },
      orderBy: { nextInspectionDate: "asc" },
      take: 5,
    }),
    prisma.insurancePolicy.findMany({
      where: { expirationDate: { gte: now, lte: addDays(now, 90) } },
      select: { id: true, carrier: true, expirationDate: true, property: { select: { name: true } } },
      orderBy: { expirationDate: "asc" },
      take: 5,
    }),
    prisma.propertyTax.findMany({
      where: { paid: false, dueDate: { gte: now, lte: addDays(now, 120) } },
      select: { id: true, amount: true, dueDate: true, property: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true, action: true, summary: true, entityType: true, createdAt: true,
        property: { select: { name: true } },
      },
    }),
    prisma.payment.findMany({
      where: { voidedAt: null },
      orderBy: { receivedOn: "desc" },
      take: 6,
      select: {
        id: true, amount: true, receivedOn: true, method: true,
        tenant: { select: { firstName: true, lastName: true } },
      },
    }),
  ]);

  // Units by status
  const unitStatus = { OCCUPIED: 0, VACANT: 0, NOTICE_GIVEN: 0, UNDER_RENOVATION: 0, UNAVAILABLE: 0 } as Record<string, number>;
  for (const u of units) unitStatus[u.status] = (unitStatus[u.status] ?? 0) + 1;
  const totalUnits = units.length;
  const occupied = unitStatus.OCCUPIED ?? 0;

  // Rent roll (monthly potential from active leases)
  const monthlyRentRoll = activeLeases.reduce((s, l) => s + num(l.rent), 0);

  // This month's rent collection
  let expected = 0;
  let collectedOnMonth = 0;
  let lateCount = 0;
  for (const c of monthCharges) {
    expected += num(c.amount);
    collectedOnMonth += c.allocations.reduce((s, a) => s + num(a.amount), 0);
    if (c.status === "LATE") lateCount++;
  }
  const outstanding = Math.max(0, expected - collectedOnMonth);

  // 12-month income/expense series
  const incomeByMonth = new Map<string, number>();
  const expenseByMonth = new Map<string, number>();
  for (const p of payments12) {
    const k = monthKey(p.receivedOn);
    incomeByMonth.set(k, (incomeByMonth.get(k) ?? 0) + num(p.amount));
  }
  for (const e of expenses12) {
    const k = monthKey(e.date);
    expenseByMonth.set(k, (expenseByMonth.get(k) ?? 0) + num(e.amount));
  }
  const performance = buckets.map((b) => {
    const income = incomeByMonth.get(b.key) ?? 0;
    const expense = expenseByMonth.get(b.key) ?? 0;
    return { month: b.label, income: Math.round(income), expenses: Math.round(expense), net: Math.round(income - expense) };
  });

  const thisKey = monthKey(now);
  const incomeThisMonth = incomeByMonth.get(thisKey) ?? 0;
  const expensesThisMonth = expenseByMonth.get(thisKey) ?? 0;

  // Maintenance summary
  const maintByStatus: Record<string, number> = {};
  let urgentCount = 0;
  for (const m of maintenance) {
    maintByStatus[m.status] = (maintByStatus[m.status] ?? 0) + 1;
    if ((m.priority === "EMERGENCY" || m.priority === "HIGH") && OPEN_MAINT.includes(m.status))
      urgentCount++;
  }
  const openMaint = maintenance.filter((m) => OPEN_MAINT.includes(m.status)).length;

  return {
    kpis: {
      propertyCount,
      totalUnits,
      occupied,
      vacant: unitStatus.VACANT ?? 0,
      occupancyRate: occupancyRate(occupied, totalUnits),
      monthlyRentRoll,
      rentCollected: collectedOnMonth,
      outstanding,
      operatingExpenses: expensesThisMonth,
      netCashFlow: incomeThisMonth - expensesThisMonth,
      depositsHeld: num(depositAgg._sum.amount),
      openMaintenance: openMaint,
      expiringLeases: expiringLeases.length,
    },
    performance,
    occupancy: [
      { name: "Occupied", value: unitStatus.OCCUPIED ?? 0, key: "OCCUPIED" },
      { name: "Vacant", value: unitStatus.VACANT ?? 0, key: "VACANT" },
      { name: "Notice Given", value: unitStatus.NOTICE_GIVEN ?? 0, key: "NOTICE_GIVEN" },
      { name: "Under Renovation", value: unitStatus.UNDER_RENOVATION ?? 0, key: "UNDER_RENOVATION" },
    ],
    collection: {
      expected,
      collected: collectedOnMonth,
      outstanding,
      late: lateCount,
      rate: collectionRate(collectedOnMonth, expected),
    },
    maintenance: {
      byStatus: maintByStatus,
      open: openMaint,
      urgent: urgentCount,
      inProgress: maintByStatus.IN_PROGRESS ?? 0,
      waiting: (maintByStatus.WAITING_ON_VENDOR ?? 0) + (maintByStatus.WAITING_ON_PARTS ?? 0),
      completed: maintByStatus.COMPLETED ?? 0,
    },
    upcoming: {
      leases: expiringLeases.map((l) => ({
        id: l.id,
        endDate: l.endDate.toISOString(),
        rent: num(l.rent),
        property: l.property.name,
        unit: l.unit.number,
        tenant: l.tenants[0] ? `${l.tenants[0].tenant.firstName} ${l.tenants[0].tenant.lastName}` : "—",
      })),
      tasks: upcomingTasks.map((t) => ({
        id: t.id, title: t.title, dueDate: t.dueDate?.toISOString() ?? null,
        priority: t.priority, status: t.status,
      })),
      inspections: upcomingInspections.map((i) => ({
        id: i.id, date: i.nextInspectionDate?.toISOString() ?? null, type: i.type, property: i.property.name,
      })),
      insurance: insurancePolicies.map((i) => ({
        id: i.id, carrier: i.carrier, date: i.expirationDate?.toISOString() ?? null, property: i.property.name,
      })),
      taxes: propertyTaxes.map((t) => ({
        id: t.id, amount: num(t.amount), date: t.dueDate?.toISOString() ?? null, property: t.property.name,
      })),
    },
    recentActivity: recentActivity.map((a) => ({
      id: a.id, action: a.action, summary: a.summary, entityType: a.entityType,
      createdAt: a.createdAt.toISOString(), property: a.property?.name ?? null,
    })),
    recentPayments: recentPayments.map((p) => ({
      id: p.id, amount: num(p.amount), receivedOn: p.receivedOn.toISOString(),
      method: p.method, tenant: p.tenant ? `${p.tenant.firstName} ${p.tenant.lastName}` : "—",
    })),
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
