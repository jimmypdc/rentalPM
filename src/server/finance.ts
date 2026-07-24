// Shared finance query helpers used by the leases, payments, rent-roll, and
// deposits modules. NOT a "use server" module — these are plain async query
// helpers and pure functions the server actions & pages import.

import { prisma } from "@/lib/db";
import { num, fullName, formatDate } from "@/lib/utils";
import { label } from "@/lib/enums";
import type { SelectOption } from "@/types";

type Numeric = number | string | { toString(): string } | null | undefined;

/** A charge's outstanding balance = amount − sum(allocations). */
export function chargeBalance(charge: {
  amount: Numeric;
  allocations: { amount: Numeric }[];
}): number {
  const allocated = charge.allocations.reduce((s, a) => s + num(a.amount), 0);
  return num(charge.amount) - allocated;
}

/** Total outstanding balance across all of a lease's live charges. */
export async function leaseBalance(leaseId: string): Promise<number> {
  const charges = await prisma.charge.findMany({
    where: { leaseId, voidedAt: null, status: { not: "WAIVED" } },
    include: { allocations: { select: { amount: true } } },
  });
  return charges.reduce((s, c) => s + chargeBalance(c), 0);
}

/** Name of the primary tenant on a lease (falls back to first tenant). */
export function primaryTenantName(
  tenants: { isPrimary: boolean; tenant: { firstName: string; lastName: string } }[],
): string {
  if (!tenants.length) return "—";
  const primary = tenants.find((t) => t.isPrimary) ?? tenants[0];
  return fullName(primary.tenant);
}

/** Active tenants as select options. */
export async function getTenantOptions(): Promise<SelectOption[]> {
  const tenants = await prisma.tenant.findMany({
    where: { deletedAt: null },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, firstName: true, lastName: true },
  });
  return tenants.map((t) => ({ value: t.id, label: fullName(t) }));
}

/** Units labelled "Property · Unit" for the lease form. */
export async function getUnitOptionsForLease(): Promise<SelectOption[]> {
  const units = await prisma.unit.findMany({
    where: { deletedAt: null },
    orderBy: { number: "asc" },
    include: { property: { select: { name: true } } },
  });
  return units.map((u) => ({
    value: u.id,
    label: `${u.property.name} · Unit ${u.number}`,
  }));
}

/** Active leases labelled "Property · Unit — Tenant". */
export async function getLeaseOptions(): Promise<SelectOption[]> {
  const leases = await prisma.lease.findMany({
    where: { deletedAt: null },
    orderBy: { startDate: "desc" },
    include: {
      property: { select: { name: true } },
      unit: { select: { number: true } },
      tenants: { include: { tenant: { select: { firstName: true, lastName: true } } } },
    },
  });
  return leases.map((l) => ({
    value: l.id,
    label: `${l.property.name} · Unit ${l.unit.number} — ${primaryTenantName(l.tenants)}`,
  }));
}

export interface OpenChargeOption {
  id: string;
  tenantId: string | null;
  label: string;
  balance: number;
}

/** Every open (unpaid/partial/late) charge across live leases, with the
 *  primary tenant id attached so the payment form can filter client-side. */
export async function getOpenCharges(): Promise<OpenChargeOption[]> {
  const charges = await prisma.charge.findMany({
    where: { voidedAt: null, status: { in: ["UNPAID", "PARTIAL", "LATE"] } },
    orderBy: { dueDate: "asc" },
    include: {
      allocations: { select: { amount: true } },
      lease: {
        include: {
          property: { select: { name: true } },
          unit: { select: { number: true } },
          tenants: { where: { isPrimary: true }, select: { tenantId: true } },
        },
      },
    },
  });
  return charges.map((c) => {
    const bal = chargeBalance(c);
    return {
      id: c.id,
      tenantId: c.lease.tenants[0]?.tenantId ?? null,
      balance: bal,
      label: `${c.lease.property.name} ${c.lease.unit.number} — ${label(c.type)} ${formatDate(
        c.dueDate,
        "short",
      )} · $${bal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    };
  });
}

/** Open charges for a single tenant (via their leases). */
export async function getOpenChargesForTenant(
  tenantId: string,
): Promise<OpenChargeOption[]> {
  const all = await getOpenCharges();
  return all.filter((c) => c.tenantId === tenantId);
}
