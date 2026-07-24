import { prisma } from "@/lib/db";
import { num, formatCurrency } from "@/lib/utils";
import { startOfMonth, endOfMonth, addMonths, addDays } from "@/lib/dates";

export type CalendarEventType =
  | "RENT_DUE"
  | "LEASE_EXPIRATION"
  | "INSPECTION"
  | "MAINTENANCE"
  | "TASK"
  | "INSURANCE_RENEWAL"
  | "PROPERTY_TAX"
  | "VENDOR_APPOINTMENT";

export interface CalendarEvent {
  id: string;
  date: string; // ISO
  type: CalendarEventType;
  title: string;
  subtitle: string;
  href: string;
}

/**
 * Aggregate portfolio events into a unified list. Returns a window spanning the
 * month before through the month after `monthISO` (default current month), and
 * always at least the next 60 days — enough for both the month grid and the
 * "Upcoming" list. The client filters this list per displayed month.
 */
export async function getCalendarEvents(monthISO?: string): Promise<CalendarEvent[]> {
  const ref = monthISO ? new Date(monthISO) : new Date();
  const base = Number.isNaN(ref.getTime()) ? new Date() : ref;

  const start = startOfMonth(addMonths(base, -1));
  const monthEnd = endOfMonth(addMonths(base, 1));
  const sixtyOut = addDays(new Date(), 60);
  const end = monthEnd.getTime() > sixtyOut.getTime() ? monthEnd : sixtyOut;

  const range = { gte: start, lte: end };

  const [charges, leases, inspections, maintenance, tasks, policies, taxes] =
    await Promise.all([
      prisma.charge.findMany({
        where: { type: "RENT", voidedAt: null, dueDate: range },
        include: {
          lease: {
            select: {
              id: true,
              property: { select: { name: true } },
              unit: { select: { number: true } },
            },
          },
        },
      }),
      prisma.lease.findMany({
        where: { deletedAt: null, endDate: range },
        select: {
          id: true,
          endDate: true,
          property: { select: { name: true } },
          unit: { select: { number: true } },
        },
      }),
      prisma.inspection.findMany({
        where: {
          deletedAt: null,
          OR: [{ inspectionDate: range }, { nextInspectionDate: range }],
        },
        include: { property: { select: { name: true } } },
      }),
      prisma.maintenanceRequest.findMany({
        where: { deletedAt: null, scheduledDate: range },
        include: {
          property: { select: { name: true } },
          vendor: { select: { companyName: true } },
        },
      }),
      prisma.task.findMany({
        where: { deletedAt: null, dueDate: range },
        include: { property: { select: { name: true } } },
      }),
      prisma.insurancePolicy.findMany({
        where: { expirationDate: range },
        include: { property: { select: { name: true } } },
      }),
      prisma.propertyTax.findMany({
        where: { dueDate: range },
        include: { property: { select: { name: true } } },
      }),
    ]);

  const events: CalendarEvent[] = [];

  for (const c of charges) {
    events.push({
      id: `charge-${c.id}`,
      date: c.dueDate.toISOString(),
      type: "RENT_DUE",
      title: `Rent due — ${c.lease.property.name}`,
      subtitle: `Unit ${c.lease.unit.number} · ${formatCurrency(num(c.amount))}`,
      href: "/payments",
    });
  }

  for (const l of leases) {
    events.push({
      id: `lease-${l.id}`,
      date: l.endDate.toISOString(),
      type: "LEASE_EXPIRATION",
      title: `Lease expiration — ${l.property.name}`,
      subtitle: `Unit ${l.unit.number}`,
      href: `/leases/${l.id}`,
    });
  }

  for (const insp of inspections) {
    if (insp.inspectionDate && insp.inspectionDate >= start && insp.inspectionDate <= end) {
      events.push({
        id: `inspection-${insp.id}`,
        date: insp.inspectionDate.toISOString(),
        type: "INSPECTION",
        title: `Inspection — ${insp.property.name}`,
        subtitle: insp.inspector ?? "Scheduled inspection",
        href: `/inspections/${insp.id}`,
      });
    }
    if (
      insp.nextInspectionDate &&
      insp.nextInspectionDate >= start &&
      insp.nextInspectionDate <= end
    ) {
      events.push({
        id: `inspection-next-${insp.id}`,
        date: insp.nextInspectionDate.toISOString(),
        type: "INSPECTION",
        title: `Next inspection — ${insp.property.name}`,
        subtitle: "Follow-up inspection due",
        href: `/inspections/${insp.id}`,
      });
    }
  }

  for (const m of maintenance) {
    if (!m.scheduledDate) continue;
    events.push({
      id: `maintenance-${m.id}`,
      date: m.scheduledDate.toISOString(),
      type: m.vendor ? "VENDOR_APPOINTMENT" : "MAINTENANCE",
      title: m.vendor
        ? `${m.vendor.companyName} — ${m.property.name}`
        : `Maintenance — ${m.property.name}`,
      subtitle: m.title,
      href: `/maintenance/${m.id}`,
    });
  }

  for (const t of tasks) {
    if (!t.dueDate) continue;
    events.push({
      id: `task-${t.id}`,
      date: t.dueDate.toISOString(),
      type: "TASK",
      title: t.title,
      subtitle: t.property?.name ?? "Task",
      href: "/tasks",
    });
  }

  for (const p of policies) {
    if (!p.expirationDate) continue;
    events.push({
      id: `insurance-${p.id}`,
      date: p.expirationDate.toISOString(),
      type: "INSURANCE_RENEWAL",
      title: `Insurance renewal — ${p.property.name}`,
      subtitle: p.carrier,
      href: `/properties/${p.propertyId}`,
    });
  }

  for (const tax of taxes) {
    if (!tax.dueDate) continue;
    events.push({
      id: `tax-${tax.id}`,
      date: tax.dueDate.toISOString(),
      type: "PROPERTY_TAX",
      title: `Property tax due — ${tax.property.name}`,
      subtitle: `${tax.year} · ${formatCurrency(num(tax.amount))}`,
      href: `/properties/${tax.propertyId}`,
    });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}
