"use server";

import { prisma } from "@/lib/db";
import { num } from "@/lib/utils";
import { chargeBalance, primaryTenantName } from "@/server/finance";

const ACTIVE_LEASE_STATUSES = ["ACTIVE", "EXPIRING_SOON", "MONTH_TO_MONTH"] as const;

export interface RentRollRow {
  id: string;
  leaseId: string | null;
  property: string;
  unit: string;
  tenant: string;
  leaseStart: string | null;
  leaseEnd: string | null;
  monthlyRent: number;
  otherMonthlyCharges: number;
  totalMonthlyCharges: number;
  amountPaidThisMonth: number;
  outstandingBalance: number;
  leaseStatus: string | null;
  occupancyStatus: string;
}

/** One row per unit: occupied units show their current lease; vacant units show
 *  market rent. Powers the Rent Roll page. */
export async function getRentRoll(): Promise<RentRollRow[]> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const units = await prisma.unit.findMany({
    where: { deletedAt: null },
    orderBy: { number: "asc" },
    include: {
      property: { select: { name: true } },
      leases: {
        where: { deletedAt: null, status: { in: [...ACTIVE_LEASE_STATUSES] } },
        orderBy: { startDate: "desc" },
        include: {
          tenants: { include: { tenant: { select: { firstName: true, lastName: true } } } },
          charges: {
            where: { voidedAt: null, status: { not: "WAIVED" } },
            include: {
              allocations: {
                include: { payment: { select: { receivedOn: true, voidedAt: true } } },
              },
            },
          },
        },
      },
    },
  });

  return units.map((u) => {
    const lease = u.leases[0];
    if (!lease) {
      return {
        id: u.id,
        leaseId: null,
        property: u.property.name,
        unit: u.number,
        tenant: "—",
        leaseStart: null,
        leaseEnd: null,
        monthlyRent: num(u.marketRent),
        otherMonthlyCharges: 0,
        totalMonthlyCharges: num(u.marketRent),
        amountPaidThisMonth: 0,
        outstandingBalance: 0,
        leaseStatus: null,
        occupancyStatus: u.status === "OCCUPIED" ? "VACANT" : u.status,
      };
    }

    const monthlyRent = num(lease.rent);
    const otherMonthlyCharges = lease.charges
      .filter(
        (c) => c.type !== "RENT" && c.dueDate >= start && c.dueDate <= end,
      )
      .reduce((s, c) => s + num(c.amount), 0);
    const amountPaidThisMonth = lease.charges.reduce(
      (s, c) =>
        s +
        c.allocations.reduce((as, a) => {
          const p = a.payment;
          if (p && !p.voidedAt && p.receivedOn >= start && p.receivedOn <= end) {
            return as + num(a.amount);
          }
          return as;
        }, 0),
      0,
    );
    const outstandingBalance = lease.charges.reduce((s, c) => s + chargeBalance(c), 0);

    return {
      id: u.id,
      leaseId: lease.id,
      property: u.property.name,
      unit: u.number,
      tenant: primaryTenantName(lease.tenants),
      leaseStart: lease.startDate.toISOString(),
      leaseEnd: lease.endDate.toISOString(),
      monthlyRent,
      otherMonthlyCharges,
      totalMonthlyCharges: monthlyRent + otherMonthlyCharges,
      amountPaidThisMonth,
      outstandingBalance,
      leaseStatus: lease.status,
      occupancyStatus: u.status,
    };
  });
}
