import { prisma } from "@/lib/db";
import type { NotificationItem } from "@/components/layout/notifications-menu";
import { addDays } from "@/lib/dates";

/**
 * Live-derived alert center. Instead of relying on stored rows, we compute the
 * current alerts from portfolio data so the bell is always accurate:
 * rent overdue, leases expiring, insurance expiring, vendor insurance expired,
 * inspections due, tasks overdue, and property tax deadlines.
 */
export async function getHeaderNotifications(): Promise<NotificationItem[]> {
  const now = new Date();
  const soon = addDays(now, 60);

  const [
    overdueRent,
    expiringLeases,
    expiringInsurance,
    expiredVendorInsurance,
    urgentMaintenance,
    overdueTasks,
    taxesDue,
  ] = await Promise.all([
    prisma.charge.count({
      where: { type: "RENT", status: { in: ["LATE", "UNPAID"] }, dueDate: { lt: now } },
    }),
    prisma.lease.count({
      where: {
        deletedAt: null,
        status: { in: ["ACTIVE", "EXPIRING_SOON"] },
        endDate: { gte: now, lte: soon },
      },
    }),
    prisma.insurancePolicy.count({
      where: { expirationDate: { gte: now, lte: soon } },
    }),
    prisma.vendor.count({
      where: { deletedAt: null, insuranceExpiration: { lt: now } },
    }),
    prisma.maintenanceRequest.count({
      where: {
        deletedAt: null,
        priority: { in: ["HIGH", "EMERGENCY"] },
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
    }),
    prisma.task.count({
      where: { deletedAt: null, status: { not: "COMPLETED" }, dueDate: { lt: now } },
    }),
    prisma.propertyTax.count({
      where: { paid: false, dueDate: { gte: now, lte: addDays(now, 90) } },
    }),
  ]);

  const items: NotificationItem[] = [];
  const nowIso = now.toISOString();
  const push = (
    cond: number,
    type: string,
    title: string,
    body: string,
    severity: string,
    href: string,
  ) => {
    if (cond > 0) items.push({ id: type, title, body, severity, href, createdAt: nowIso });
  };

  push(overdueRent, "RENT_OVERDUE", "Rent overdue", `${overdueRent} rent charge${overdueRent > 1 ? "s" : ""} past due.`, "CRITICAL", "/payments");
  push(urgentMaintenance, "MAINTENANCE_URGENT", "Urgent maintenance open", `${urgentMaintenance} high/emergency request${urgentMaintenance > 1 ? "s" : ""} open.`, "CRITICAL", "/maintenance");
  push(expiredVendorInsurance, "VENDOR_INSURANCE", "Vendor insurance expired", `${expiredVendorInsurance} vendor${expiredVendorInsurance > 1 ? "s have" : " has"} expired insurance.`, "CRITICAL", "/vendors");
  push(overdueTasks, "TASK_OVERDUE", "Tasks overdue", `${overdueTasks} task${overdueTasks > 1 ? "s are" : " is"} overdue.`, "WARNING", "/tasks");
  push(expiringLeases, "LEASE_EXPIRING", "Leases expiring soon", `${expiringLeases} lease${expiringLeases > 1 ? "s expire" : " expires"} within 60 days.`, "WARNING", "/leases");
  push(expiringInsurance, "INSURANCE_EXPIRING", "Insurance renewal due", `${expiringInsurance} polic${expiringInsurance > 1 ? "ies" : "y"} expiring within 60 days.`, "WARNING", "/properties");
  push(taxesDue, "PROPERTY_TAX", "Property tax due", `${taxesDue} tax deadline${taxesDue > 1 ? "s" : ""} within 90 days.`, "WARNING", "/properties");

  return items;
}
