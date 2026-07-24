"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { taskSchema } from "@/lib/validations/task";
import { logActivity, toDate } from "@/server/common";
import { ok, fail, type ActionResult } from "@/types";

function isOverdue(dueDate: Date | null, status: string): boolean {
  if (!dueDate || status === "COMPLETED") return false;
  return dueDate.getTime() < Date.now();
}

export async function listTasks() {
  const rows = await prisma.task.findMany({
    where: { deletedAt: null },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    include: { property: { select: { name: true } } },
  });
  return rows.map((t) => ({
    id: t.id,
    title: t.title,
    category: t.category,
    priority: t.priority,
    status: t.status,
    dueDate: t.dueDate?.toISOString() ?? null,
    property: t.property?.name ?? null,
    overdue: isOverdue(t.dueDate, t.status),
    completedAt: t.completedAt?.toISOString() ?? null,
  }));
}

export async function getTaskCalendar() {
  const rows = await prisma.task.findMany({
    where: { deletedAt: null, dueDate: { not: null } },
    orderBy: { dueDate: "asc" },
    select: { id: true, title: true, dueDate: true, status: true, priority: true },
  });
  return rows.map((t) => ({
    id: t.id,
    title: t.title,
    dueDate: t.dueDate!.toISOString(),
    status: t.status,
    priority: t.priority,
  }));
}

function parse(formData: FormData) {
  return taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    propertyId: formData.get("propertyId") || undefined,
    tenantId: formData.get("tenantId") || undefined,
    vendorId: formData.get("vendorId") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    priority: formData.get("priority"),
    status: formData.get("status"),
    category: formData.get("category"),
    reminderAt: formData.get("reminderAt") || undefined,
    notes: formData.get("notes"),
  });
}

export async function createTask(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Please fix the errors and try again.", parsed.error.flatten().fieldErrors);
  }
  const d = parsed.data;
  const task = await prisma.task.create({
    data: {
      title: d.title,
      description: d.description,
      propertyId: d.propertyId || null,
      tenantId: d.tenantId || null,
      vendorId: d.vendorId || null,
      dueDate: toDate(d.dueDate),
      priority: d.priority,
      status: d.status,
      category: d.category,
      reminderAt: toDate(d.reminderAt),
      completedAt: d.status === "COMPLETED" ? new Date() : null,
      notes: d.notes,
    },
  });
  await logActivity({
    action: "TASK_CREATED", entityType: "Task", entityId: task.id,
    summary: `Added task: ${task.title}`,
    propertyId: task.propertyId ?? undefined, userId: user.id,
  });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return ok({ id: task.id });
}

export async function updateTask(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Please fix the errors and try again.", parsed.error.flatten().fieldErrors);
  }
  const d = parsed.data;
  const existing = await prisma.task.findUnique({ where: { id }, select: { completedAt: true } });
  const task = await prisma.task.update({
    where: { id },
    data: {
      title: d.title,
      description: d.description,
      propertyId: d.propertyId || null,
      tenantId: d.tenantId || null,
      vendorId: d.vendorId || null,
      dueDate: toDate(d.dueDate),
      priority: d.priority,
      status: d.status,
      category: d.category,
      reminderAt: toDate(d.reminderAt),
      completedAt:
        d.status === "COMPLETED"
          ? (existing?.completedAt ?? new Date())
          : null,
      notes: d.notes,
    },
  });
  await logActivity({
    action: "TASK_UPDATED", entityType: "Task", entityId: id,
    summary: `Updated task: ${task.title}`,
    propertyId: task.propertyId ?? undefined, userId: user.id,
  });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return ok({ id });
}

export async function toggleTaskComplete(id: string): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const task = await prisma.task.findUnique({ where: { id }, select: { status: true, title: true } });
  if (!task) return fail("Task not found.");
  const completing = task.status !== "COMPLETED";
  await prisma.task.update({
    where: { id },
    data: {
      status: completing ? "COMPLETED" : "TODO",
      completedAt: completing ? new Date() : null,
    },
  });
  await logActivity({
    action: completing ? "TASK_COMPLETED" : "TASK_REOPENED", entityType: "Task", entityId: id,
    summary: `${completing ? "Completed" : "Reopened"} task: ${task.title}`, userId: user.id,
  });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return ok({ id });
}

export async function deleteTask(id: string): Promise<ActionResult> {
  const user = await requireUser();
  await prisma.task.update({ where: { id }, data: { deletedAt: new Date() } });
  await logActivity({
    action: "TASK_DELETED", entityType: "Task", entityId: id,
    summary: "Archived a task", userId: user.id,
  });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return ok(undefined);
}

export async function getTaskFormData() {
  const [properties, tenants, vendors] = await Promise.all([
    prisma.property.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.tenant.findMany({
      where: { deletedAt: null },
      orderBy: { lastName: "asc" },
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.vendor.findMany({
      where: { deletedAt: null },
      orderBy: { companyName: "asc" },
      select: { id: true, companyName: true },
    }),
  ]);
  return {
    properties: properties.map((p) => ({ value: p.id, label: p.name })),
    tenants: tenants.map((t) => ({ value: t.id, label: `${t.firstName} ${t.lastName}` })),
    vendors: vendors.map((v) => ({ value: v.id, label: v.companyName })),
  };
}
