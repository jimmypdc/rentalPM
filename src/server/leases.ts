"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { num, daysUntil, fullName } from "@/lib/utils";
import { leaseSchema } from "@/lib/validations/lease";
import { logActivity, toDate, toNum } from "@/server/common";
import {
  chargeBalance,
  primaryTenantName,
  getTenantOptions,
  getUnitOptionsForLease,
} from "@/server/finance";
import { ok, fail, type ActionResult } from "@/types";

/** Alert severity from days until the lease ends (null when far off). */
function expirationAlert(
  endDate: Date | string | null | undefined,
): { days: number; level: 30 | 60 | 90 | 120 } | null {
  const days = daysUntil(endDate);
  if (days === null || days < 0) return null;
  if (days <= 30) return { days, level: 30 };
  if (days <= 60) return { days, level: 60 };
  if (days <= 90) return { days, level: 90 };
  if (days <= 120) return { days, level: 120 };
  return null;
}

export async function listLeases() {
  const leases = await prisma.lease.findMany({
    where: { deletedAt: null },
    orderBy: { startDate: "desc" },
    include: {
      property: { select: { name: true } },
      unit: { select: { number: true } },
      tenants: { include: { tenant: { select: { firstName: true, lastName: true } } } },
      charges: {
        where: { voidedAt: null, status: { not: "WAIVED" } },
        include: { allocations: { select: { amount: true } } },
      },
    },
  });

  return leases.map((l) => ({
    id: l.id,
    property: l.property.name,
    unit: l.unit.number,
    tenant: primaryTenantName(l.tenants),
    tenantNames: l.tenants.map((t) => fullName(t.tenant)).join(", ") || "—",
    startDate: l.startDate.toISOString(),
    endDate: l.endDate.toISOString(),
    rent: num(l.rent),
    status: l.status,
    daysUntilEnd: daysUntil(l.endDate),
    balance: l.charges.reduce((s, c) => s + chargeBalance(c), 0),
  }));
}

export async function getLease(id: string) {
  const lease = await prisma.lease.findFirst({
    where: { id, deletedAt: null },
    include: {
      property: { select: { id: true, name: true } },
      unit: { select: { id: true, number: true, status: true } },
      tenants: { include: { tenant: true } },
      charges: {
        orderBy: { dueDate: "desc" },
        include: { allocations: { select: { amount: true } } },
      },
      securityDeposits: {
        include: { tenant: { select: { firstName: true, lastName: true } } },
      },
      documents: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!lease) return null;

  const live = lease.charges.filter((c) => !c.voidedAt && c.status !== "WAIVED");
  const totalBilled = live.reduce((s, c) => s + num(c.amount), 0);
  const balance = live.reduce((s, c) => s + chargeBalance(c), 0);
  const totalPaid = totalBilled - balance;

  return {
    lease,
    charges: lease.charges,
    balance,
    totalBilled,
    totalPaid,
    depositHeld: lease.securityDeposits.reduce((s, d) => s + num(d.amount), 0),
    alert: expirationAlert(lease.endDate),
  };
}

export async function getLeaseFormData() {
  const [units, tenants] = await Promise.all([
    getUnitOptionsForLease(),
    getTenantOptions(),
  ]);
  return { units, tenants };
}

function parse(formData: FormData) {
  return leaseSchema.safeParse({
    propertyId: formData.get("propertyId") || undefined,
    unitId: formData.get("unitId"),
    tenantId: formData.get("tenantId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    rent: formData.get("rent"),
    securityDeposit: formData.get("securityDeposit") || undefined,
    petDeposit: formData.get("petDeposit") || undefined,
    otherDeposit: formData.get("otherDeposit") || undefined,
    lateFee: formData.get("lateFee") || undefined,
    gracePeriodDays: formData.get("gracePeriodDays") || undefined,
    rentDueDay: formData.get("rentDueDay") || undefined,
    status: formData.get("status"),
    renewalStatus: formData.get("renewalStatus"),
    moveInDate: formData.get("moveInDate") || undefined,
    moveOutDate: formData.get("moveOutDate") || undefined,
    notes: formData.get("notes"),
  });
}

export async function createLease(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Please fix the errors and try again.", parsed.error.flatten().fieldErrors);
  }
  const d = parsed.data;

  // Derive the property from the chosen unit.
  const unit = await prisma.unit.findUnique({
    where: { id: d.unitId },
    select: { propertyId: true },
  });
  if (!unit) return fail("Selected unit could not be found.");

  const rent = toNum(d.rent) ?? 0;
  const dueDay = toNum(d.rentDueDay) ?? 1;
  const startDate = toDate(d.startDate) ?? new Date();

  const lease = await prisma.lease.create({
    data: {
      propertyId: unit.propertyId,
      unitId: d.unitId,
      startDate,
      endDate: toDate(d.endDate) ?? startDate,
      rent,
      securityDeposit: toNum(d.securityDeposit),
      petDeposit: toNum(d.petDeposit),
      otherDeposit: toNum(d.otherDeposit),
      lateFee: toNum(d.lateFee),
      gracePeriodDays: toNum(d.gracePeriodDays) ?? 5,
      rentDueDay: dueDay,
      status: d.status,
      renewalStatus: d.renewalStatus,
      moveInDate: toDate(d.moveInDate),
      moveOutDate: toDate(d.moveOutDate),
      notes: d.notes,
      tenants: { create: { tenantId: d.tenantId, isPrimary: true } },
    },
  });

  // Auto-generate the first month's rent charge (due on the rent-due day of the
  // lease start month).
  if (rent > 0) {
    const firstDue = new Date(startDate.getFullYear(), startDate.getMonth(), dueDay);
    await prisma.charge.create({
      data: {
        leaseId: lease.id,
        type: "RENT",
        description: "Monthly rent",
        amount: rent,
        dueDate: firstDue,
        status: "UNPAID",
      },
    });
  }

  await logActivity({
    action: "LEASE_CREATED", entityType: "Lease", entityId: lease.id,
    summary: "Created a lease", propertyId: unit.propertyId, userId: user.id,
  });
  revalidatePath("/leases");
  revalidatePath("/rent-roll");
  revalidatePath("/dashboard");
  return ok({ id: lease.id });
}

export async function updateLease(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Please fix the errors and try again.", parsed.error.flatten().fieldErrors);
  }
  const d = parsed.data;

  const unit = await prisma.unit.findUnique({
    where: { id: d.unitId },
    select: { propertyId: true },
  });
  if (!unit) return fail("Selected unit could not be found.");

  const startDate = toDate(d.startDate) ?? new Date();

  await prisma.lease.update({
    where: { id },
    data: {
      propertyId: unit.propertyId,
      unitId: d.unitId,
      startDate,
      endDate: toDate(d.endDate) ?? startDate,
      rent: toNum(d.rent) ?? 0,
      securityDeposit: toNum(d.securityDeposit),
      petDeposit: toNum(d.petDeposit),
      otherDeposit: toNum(d.otherDeposit),
      lateFee: toNum(d.lateFee),
      gracePeriodDays: toNum(d.gracePeriodDays) ?? 5,
      rentDueDay: toNum(d.rentDueDay) ?? 1,
      status: d.status,
      renewalStatus: d.renewalStatus,
      moveInDate: toDate(d.moveInDate),
      moveOutDate: toDate(d.moveOutDate),
      notes: d.notes,
    },
  });

  // Keep the primary tenant in sync (single-primary-tenant model).
  const existingPrimary = await prisma.leaseTenant.findFirst({
    where: { leaseId: id, isPrimary: true },
  });
  if (existingPrimary && existingPrimary.tenantId !== d.tenantId) {
    await prisma.leaseTenant.delete({ where: { id: existingPrimary.id } });
  }
  if (!existingPrimary || existingPrimary.tenantId !== d.tenantId) {
    await prisma.leaseTenant.upsert({
      where: { leaseId_tenantId: { leaseId: id, tenantId: d.tenantId } },
      create: { leaseId: id, tenantId: d.tenantId, isPrimary: true },
      update: { isPrimary: true },
    });
  }

  await logActivity({
    action: "LEASE_UPDATED", entityType: "Lease", entityId: id,
    summary: "Updated a lease", propertyId: unit.propertyId, userId: user.id,
  });
  revalidatePath("/leases");
  revalidatePath(`/leases/${id}`);
  revalidatePath("/rent-roll");
  return ok({ id });
}

export async function terminateLease(id: string): Promise<ActionResult> {
  const user = await requireUser();
  await prisma.lease.update({
    where: { id },
    data: { status: "TERMINATED", moveOutDate: new Date() },
  });
  await logActivity({
    action: "LEASE_TERMINATED", entityType: "Lease", entityId: id,
    summary: "Terminated a lease", userId: user.id,
  });
  revalidatePath("/leases");
  revalidatePath(`/leases/${id}`);
  revalidatePath("/rent-roll");
  return ok(undefined);
}
