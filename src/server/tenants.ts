"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { num } from "@/lib/utils";
import { tenantSchema } from "@/lib/validations/tenant";
import { logActivity, toDate, toNum } from "@/server/common";
import { ok, fail, type ActionResult } from "@/types";

const ACTIVE_LEASE = ["ACTIVE", "EXPIRING_SOON", "MONTH_TO_MONTH"] as const;
const OPEN_CHARGE = ["UNPAID", "PARTIAL", "LATE"] as const;

function isActive(status: string) {
  return (ACTIVE_LEASE as readonly string[]).includes(status);
}

export async function listTenants() {
  const tenants = await prisma.tenant.findMany({
    where: { deletedAt: null },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      leaseTenants: {
        include: {
          lease: {
            include: {
              property: { select: { name: true } },
              unit: { select: { number: true } },
              charges: {
                where: { status: { not: "VOID" } },
                select: { amount: true, allocations: { select: { amount: true } } },
              },
            },
          },
        },
      },
    },
  });

  return tenants.map((t) => {
    const activeLt =
      t.leaseTenants.find((lt) => isActive(lt.lease.status)) ?? t.leaseTenants[0];
    const activeLease = activeLt?.lease;

    let balance = 0;
    for (const lt of t.leaseTenants) {
      for (const c of lt.lease.charges) {
        const allocated = c.allocations.reduce((s, a) => s + num(a.amount), 0);
        balance += num(c.amount) - allocated;
      }
    }

    return {
      id: t.id,
      firstName: t.firstName,
      lastName: t.lastName,
      email: t.email,
      phone: t.phone,
      status: t.status,
      currentProperty: activeLease?.property.name ?? null,
      currentUnit: activeLease?.unit.number ?? null,
      rent: num(activeLease?.rent),
      balance,
      moveInDate: t.moveInDate?.toISOString() ?? null,
    };
  });
}

export async function getTenant(id: string) {
  const tenant = await prisma.tenant.findFirst({
    where: { id, deletedAt: null },
    include: {
      leaseTenants: {
        include: {
          lease: {
            include: {
              property: { select: { id: true, name: true } },
              unit: { select: { id: true, number: true } },
              charges: {
                where: { status: { not: "VOID" } },
                include: { allocations: { select: { amount: true } } },
              },
              securityDeposits: true,
            },
          },
        },
      },
      payments: { where: { voidedAt: null }, orderBy: { receivedOn: "desc" }, take: 12 },
      maintenanceRequests: {
        where: { deletedAt: null },
        orderBy: { reportedDate: "desc" },
        include: { property: { select: { name: true } }, unit: { select: { number: true } } },
      },
      documents: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!tenant) return null;

  const activeLt =
    tenant.leaseTenants.find((lt) => isActive(lt.lease.status)) ?? tenant.leaseTenants[0];
  const activeLease = activeLt?.lease ?? null;

  let currentBalance = 0;
  for (const lt of tenant.leaseTenants) {
    for (const c of lt.lease.charges) {
      const allocated = c.allocations.reduce((s, a) => s + num(a.amount), 0);
      currentBalance += num(c.amount) - allocated;
    }
  }

  const rentAmount = num(activeLease?.rent);

  let nextRentDue: string | null = null;
  if (activeLease) {
    const upcoming = activeLease.charges
      .filter(
        (c) =>
          c.type === "RENT" &&
          (OPEN_CHARGE as readonly string[]).includes(c.status),
      )
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    nextRentDue = upcoming[0]?.dueDate.toISOString() ?? null;
  }

  const depositRecords = activeLease?.securityDeposits ?? [];
  const securityDeposit = depositRecords.length
    ? depositRecords.reduce((s, d) => s + num(d.amount), 0)
    : num(activeLease?.securityDeposit);

  return {
    tenant,
    activeLease,
    stats: {
      currentBalance,
      rentAmount,
      nextRentDue,
      securityDeposit,
      leaseStart: activeLease?.startDate?.toISOString() ?? null,
      leaseEnd: activeLease?.endDate?.toISOString() ?? null,
    },
    payments: tenant.payments,
    maintenance: tenant.maintenanceRequests,
    documents: tenant.documents,
  };
}

function parse(formData: FormData) {
  return tenantSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    dateOfBirth: formData.get("dateOfBirth"),
    emergencyName: formData.get("emergencyName"),
    emergencyPhone: formData.get("emergencyPhone"),
    employer: formData.get("employer"),
    monthlyIncome: formData.get("monthlyIncome") || undefined,
    vehicleInfo: formData.get("vehicleInfo"),
    pets: formData.get("pets"),
    notes: formData.get("notes"),
    status: formData.get("status"),
    moveInDate: formData.get("moveInDate"),
    moveOutDate: formData.get("moveOutDate"),
  });
}

export async function createTenant(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Please fix the errors and try again.", parsed.error.flatten().fieldErrors);
  }
  const d = parsed.data;
  const tenant = await prisma.tenant.create({
    data: {
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email || null,
      phone: d.phone,
      dateOfBirth: toDate(d.dateOfBirth),
      emergencyName: d.emergencyName,
      emergencyPhone: d.emergencyPhone,
      employer: d.employer,
      monthlyIncome: toNum(d.monthlyIncome),
      status: d.status,
      moveInDate: toDate(d.moveInDate),
      moveOutDate: toDate(d.moveOutDate),
      vehicleInfo: d.vehicleInfo,
      pets: d.pets,
      notes: d.notes,
    },
  });
  await logActivity({
    action: "TENANT_CREATED", entityType: "Tenant", entityId: tenant.id,
    summary: `Added tenant ${tenant.firstName} ${tenant.lastName}`, userId: user.id,
  });
  revalidatePath("/tenants");
  return ok({ id: tenant.id });
}

export async function updateTenant(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Please fix the errors and try again.", parsed.error.flatten().fieldErrors);
  }
  const d = parsed.data;
  await prisma.tenant.update({
    where: { id },
    data: {
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email || null,
      phone: d.phone,
      dateOfBirth: toDate(d.dateOfBirth),
      emergencyName: d.emergencyName,
      emergencyPhone: d.emergencyPhone,
      employer: d.employer,
      monthlyIncome: toNum(d.monthlyIncome),
      status: d.status,
      moveInDate: toDate(d.moveInDate),
      moveOutDate: toDate(d.moveOutDate),
      vehicleInfo: d.vehicleInfo,
      pets: d.pets,
      notes: d.notes,
    },
  });
  await logActivity({
    action: "TENANT_UPDATED", entityType: "Tenant", entityId: id,
    summary: `Updated tenant ${d.firstName} ${d.lastName}`, userId: user.id,
  });
  revalidatePath("/tenants");
  revalidatePath(`/tenants/${id}`);
  return ok({ id });
}

export async function deleteTenant(id: string): Promise<ActionResult> {
  const user = await requireUser();
  await prisma.tenant.update({ where: { id }, data: { deletedAt: new Date() } });
  await logActivity({
    action: "TENANT_DELETED", entityType: "Tenant", entityId: id,
    summary: "Archived a tenant", userId: user.id,
  });
  revalidatePath("/tenants");
  return ok(undefined);
}
