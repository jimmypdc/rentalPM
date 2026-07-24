"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { num, fullName } from "@/lib/utils";
import { depositSchema } from "@/lib/validations/deposit";
import { logActivity, toDate, toNum } from "@/server/common";
import { getLeaseOptions, getTenantOptions } from "@/server/finance";
import { ok, fail, type ActionResult } from "@/types";

export async function listDeposits() {
  const deposits = await prisma.securityDeposit.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      tenant: { select: { firstName: true, lastName: true } },
      lease: {
        include: {
          property: { select: { name: true } },
          unit: { select: { number: true } },
        },
      },
    },
  });

  return deposits.map((d) => ({
    id: d.id,
    tenant: fullName(d.tenant),
    property: d.lease.property.name,
    unit: d.lease.unit.number,
    amount: num(d.amount),
    receivedOn: d.receivedOn?.toISOString() ?? null,
    status: d.status,
    refundAmount: num(d.refundAmount),
    account: d.account,
  }));
}

export async function getDepositFormData() {
  const [leases, tenants] = await Promise.all([
    getLeaseOptions(),
    getTenantOptions(),
  ]);
  return { leases, tenants };
}

function parse(formData: FormData) {
  return depositSchema.safeParse({
    leaseId: formData.get("leaseId"),
    tenantId: formData.get("tenantId") || undefined,
    amount: formData.get("amount"),
    receivedOn: formData.get("receivedOn") || undefined,
    account: formData.get("account"),
    interest: formData.get("interest") || undefined,
    deductions: formData.get("deductions") || undefined,
    refundAmount: formData.get("refundAmount") || undefined,
    refundedOn: formData.get("refundedOn") || undefined,
    status: formData.get("status"),
    notes: formData.get("notes"),
  });
}

export async function createDeposit(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Please fix the errors and try again.", parsed.error.flatten().fieldErrors);
  }
  const d = parsed.data;
  const deposit = await prisma.securityDeposit.create({
    data: {
      leaseId: d.leaseId,
      tenantId: d.tenantId || null,
      amount: toNum(d.amount) ?? 0,
      receivedOn: toDate(d.receivedOn),
      account: d.account,
      interest: toNum(d.interest),
      deductions: toNum(d.deductions),
      refundAmount: toNum(d.refundAmount),
      refundedOn: toDate(d.refundedOn),
      status: d.status,
      notes: d.notes,
    },
  });
  await logActivity({
    action: "DEPOSIT_CREATED", entityType: "SecurityDeposit", entityId: deposit.id,
    summary: "Recorded a security deposit", userId: user.id,
  });
  revalidatePath("/deposits");
  return ok({ id: deposit.id });
}

export async function updateDeposit(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Please fix the errors and try again.", parsed.error.flatten().fieldErrors);
  }
  const d = parsed.data;
  await prisma.securityDeposit.update({
    where: { id },
    data: {
      leaseId: d.leaseId,
      tenantId: d.tenantId || null,
      amount: toNum(d.amount) ?? 0,
      receivedOn: toDate(d.receivedOn),
      account: d.account,
      interest: toNum(d.interest),
      deductions: toNum(d.deductions),
      refundAmount: toNum(d.refundAmount),
      refundedOn: toDate(d.refundedOn),
      status: d.status,
      notes: d.notes,
    },
  });
  await logActivity({
    action: "DEPOSIT_UPDATED", entityType: "SecurityDeposit", entityId: id,
    summary: "Updated a security deposit", userId: user.id,
  });
  revalidatePath("/deposits");
  revalidatePath(`/deposits/${id}`);
  return ok({ id });
}
