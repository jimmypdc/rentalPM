"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { num } from "@/lib/utils";
import { expenseSchema } from "@/lib/validations/expense";
import { logActivity, toDate, toNum } from "@/server/common";
import { ok, fail, type ActionResult } from "@/types";

export async function listExpenses() {
  const expenses = await prisma.expense.findMany({
    orderBy: { date: "desc" },
    include: {
      property: { select: { name: true } },
      unit: { select: { number: true } },
      vendor: { select: { companyName: true } },
    },
  });
  return expenses.map((e) => ({
    id: e.id,
    date: e.date.toISOString(),
    property: e.property.name,
    unit: e.unit?.number ?? null,
    vendor: e.vendor?.companyName ?? null,
    category: e.category,
    description: e.description,
    amount: num(e.amount),
    method: e.method,
    taxDeductible: e.taxDeductible,
    isRecurring: e.isRecurring,
    voided: e.voidedAt !== null,
  }));
}

export async function getExpenseFormData() {
  const [properties, vendors, units] = await Promise.all([
    prisma.property.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.vendor.findMany({
      where: { deletedAt: null },
      orderBy: { companyName: "asc" },
      select: { id: true, companyName: true },
    }),
    prisma.unit.findMany({
      where: { deletedAt: null },
      orderBy: { number: "asc" },
      select: { id: true, number: true, propertyId: true },
    }),
  ]);
  return {
    properties: properties.map((p) => ({ value: p.id, label: p.name })),
    vendors: vendors.map((v) => ({ value: v.id, label: v.companyName })),
    units: units.map((u) => ({
      value: u.id,
      label: `Unit ${u.number}`,
      propertyId: u.propertyId,
    })),
  };
}

function parse(formData: FormData) {
  return expenseSchema.safeParse({
    date: formData.get("date"),
    propertyId: formData.get("propertyId"),
    unitId: formData.get("unitId") || undefined,
    vendorId: formData.get("vendorId") || undefined,
    category: formData.get("category"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    method: formData.get("method"),
    taxDeductible:
      formData.get("taxDeductible") === "true" || formData.get("taxDeductible") === "on",
    isRecurring:
      formData.get("isRecurring") === "true" || formData.get("isRecurring") === "on",
    notes: formData.get("notes"),
  });
}

function revalidate() {
  revalidatePath("/expenses");
  revalidatePath("/accounting");
  revalidatePath("/dashboard");
}

export async function createExpense(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Please fix the errors and try again.", parsed.error.flatten().fieldErrors);
  }
  const d = parsed.data;
  const expense = await prisma.expense.create({
    data: {
      date: toDate(d.date) ?? new Date(),
      propertyId: d.propertyId,
      unitId: d.unitId || null,
      vendorId: d.vendorId || null,
      category: d.category,
      description: d.description,
      amount: toNum(d.amount) ?? 0,
      method: d.method,
      taxDeductible: d.taxDeductible,
      isRecurring: d.isRecurring,
      notes: d.notes,
      enteredById: user.id,
    },
  });
  await logActivity({
    action: "EXPENSE_ENTERED",
    entityType: "Expense",
    entityId: expense.id,
    summary: `Logged ${d.category} expense of $${toNum(d.amount) ?? 0}`,
    propertyId: d.propertyId,
    userId: user.id,
  });
  revalidate();
  return ok({ id: expense.id });
}

export async function updateExpense(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Please fix the errors and try again.", parsed.error.flatten().fieldErrors);
  }
  const d = parsed.data;
  await prisma.expense.update({
    where: { id },
    data: {
      date: toDate(d.date) ?? new Date(),
      propertyId: d.propertyId,
      unitId: d.unitId || null,
      vendorId: d.vendorId || null,
      category: d.category,
      description: d.description,
      amount: toNum(d.amount) ?? 0,
      method: d.method,
      taxDeductible: d.taxDeductible,
      isRecurring: d.isRecurring,
      notes: d.notes,
    },
  });
  await logActivity({
    action: "EXPENSE_ENTERED",
    entityType: "Expense",
    entityId: id,
    summary: `Updated ${d.category} expense`,
    propertyId: d.propertyId,
    userId: user.id,
  });
  revalidate();
  return ok({ id });
}

export async function voidExpense(id: string): Promise<ActionResult> {
  const user = await requireUser();
  // Financial records are never hard-deleted — mark as voided.
  await prisma.expense.update({ where: { id }, data: { voidedAt: new Date() } });
  await logActivity({
    action: "EXPENSE_ENTERED",
    entityType: "Expense",
    entityId: id,
    summary: "Voided an expense",
    userId: user.id,
  });
  revalidate();
  return ok(undefined);
}
