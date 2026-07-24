"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { num, fullName } from "@/lib/utils";
import { label } from "@/lib/enums";
import { paymentSchema } from "@/lib/validations/payment";
import { logActivity, toDate, toNum } from "@/server/common";
import {
  chargeBalance,
  getTenantOptions,
  getOpenCharges,
  getOpenChargesForTenant,
} from "@/server/finance";
import { ok, fail, type ActionResult } from "@/types";

export { getOpenChargesForTenant };

/** Derive a charge's status from its outstanding balance vs. its amount. */
function statusForBalance(amount: number, balance: number): "PAID" | "PARTIAL" | "UNPAID" {
  if (balance <= 0.0001) return "PAID";
  if (balance < amount - 0.0001) return "PARTIAL";
  return "UNPAID";
}

export async function listPayments() {
  const payments = await prisma.payment.findMany({
    orderBy: { receivedOn: "desc" },
    include: {
      tenant: { select: { firstName: true, lastName: true } },
      allocations: {
        include: {
          charge: {
            include: {
              lease: {
                include: {
                  property: { select: { name: true } },
                  unit: { select: { number: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  return payments.map((p) => {
    const first = p.allocations[0];
    const allocatedTo = first
      ? `${first.charge.lease.property.name} ${first.charge.lease.unit.number} — ${label(first.charge.type)}`
      : "Unapplied";
    return {
      id: p.id,
      tenant: fullName(p.tenant),
      amount: num(p.amount),
      receivedOn: p.receivedOn.toISOString(),
      method: p.method,
      reference: p.reference,
      allocatedTo,
      voided: !!p.voidedAt,
    };
  });
}

export async function getPaymentKpis() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [monthPayments, openCharges] = await Promise.all([
    prisma.payment.findMany({
      where: { voidedAt: null, receivedOn: { gte: start, lte: end } },
      select: { amount: true },
    }),
    prisma.charge.findMany({
      where: { voidedAt: null, status: { in: ["UNPAID", "PARTIAL", "LATE"] } },
      include: { allocations: { select: { amount: true } } },
    }),
  ]);

  const collectedThisMonth = monthPayments.reduce((s, p) => s + num(p.amount), 0);
  const outstanding = openCharges.reduce((s, c) => s + chargeBalance(c), 0);
  const expectedThisMonth = openCharges
    .filter((c) => c.dueDate >= start && c.dueDate <= end)
    .reduce((s, c) => s + num(c.amount), 0);

  return { collectedThisMonth, outstanding, expectedThisMonth };
}

export async function getPaymentFormData() {
  const [tenants, openCharges] = await Promise.all([
    getTenantOptions(),
    getOpenCharges(),
  ]);
  return { tenants, openCharges };
}

function parse(formData: FormData) {
  return paymentSchema.safeParse({
    tenantId: formData.get("tenantId"),
    amount: formData.get("amount"),
    receivedOn: formData.get("receivedOn"),
    method: formData.get("method"),
    chargeId: formData.get("chargeId") || undefined,
    reference: formData.get("reference"),
    notes: formData.get("notes"),
  });
}

export async function recordPayment(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Please fix the errors and try again.", parsed.error.flatten().fieldErrors);
  }
  const d = parsed.data;
  const amount = toNum(d.amount) ?? 0;

  const paymentId = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        tenantId: d.tenantId,
        amount,
        receivedOn: toDate(d.receivedOn) ?? new Date(),
        method: d.method,
        reference: d.reference,
        notes: d.notes,
        enteredById: user.id,
      },
    });

    if (d.chargeId) {
      const charge = await tx.charge.findUnique({
        where: { id: d.chargeId },
        include: { allocations: { select: { amount: true } } },
      });
      if (charge) {
        const bal = chargeBalance(charge);
        const applied = Math.min(amount, bal);
        if (applied > 0) {
          await tx.paymentAllocation.create({
            data: { paymentId: payment.id, chargeId: charge.id, amount: applied },
          });
          const newBalance = bal - applied;
          await tx.charge.update({
            where: { id: charge.id },
            data: { status: statusForBalance(num(charge.amount), newBalance) },
          });
        }
      }
    }
    return payment.id;
  });

  await logActivity({
    action: "PAYMENT_RECORDED", entityType: "Payment", entityId: paymentId,
    summary: `Recorded a payment of $${amount.toLocaleString("en-US")}`, userId: user.id,
  });
  revalidatePath("/payments");
  revalidatePath("/rent-roll");
  revalidatePath("/dashboard");
  return ok({ id: paymentId });
}

export async function voidPayment(id: string): Promise<ActionResult> {
  const user = await requireUser();

  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id },
      include: { allocations: true },
    });
    if (!payment) return;

    const chargeIds = payment.allocations.map((a) => a.chargeId);

    // Remove this payment's allocations, then recompute each affected charge.
    await tx.paymentAllocation.deleteMany({ where: { paymentId: id } });

    for (const chargeId of chargeIds) {
      const charge = await tx.charge.findUnique({
        where: { id: chargeId },
        include: { allocations: { select: { amount: true } } },
      });
      if (!charge || charge.voidedAt) continue;
      const bal = chargeBalance(charge);
      await tx.charge.update({
        where: { id: chargeId },
        data: { status: statusForBalance(num(charge.amount), bal) },
      });
    }

    await tx.payment.update({
      where: { id },
      data: { voidedAt: new Date(), voidReason: "Voided" },
    });
  });

  await logActivity({
    action: "PAYMENT_VOIDED", entityType: "Payment", entityId: id,
    summary: "Voided a payment", userId: user.id,
  });
  revalidatePath("/payments");
  revalidatePath("/rent-roll");
  revalidatePath("/dashboard");
  return ok(undefined);
}
