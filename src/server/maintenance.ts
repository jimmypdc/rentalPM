"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { num } from "@/lib/utils";
import { MaintenanceStatusValues } from "@/lib/enums";
import { maintenanceSchema } from "@/lib/validations/maintenance";
import { logActivity, toDate, toNum } from "@/server/common";
import { ok, fail, type ActionResult } from "@/types";

function ageDays(from: Date): number {
  return Math.max(0, Math.floor((Date.now() - from.getTime()) / 86400000));
}

export async function listMaintenance() {
  const rows = await prisma.maintenanceRequest.findMany({
    where: { deletedAt: null },
    orderBy: { reportedDate: "desc" },
    include: {
      property: { select: { name: true } },
      unit: { select: { number: true } },
      tenant: { select: { firstName: true, lastName: true } },
      vendor: { select: { companyName: true } },
    },
  });
  return rows.map((m) => ({
    id: m.id,
    number: m.number,
    title: m.title,
    property: m.property.name,
    unit: m.unit?.number ?? null,
    tenant: m.tenant ? `${m.tenant.firstName} ${m.tenant.lastName}` : null,
    category: m.category,
    priority: m.priority,
    status: m.status,
    vendor: m.vendor?.companyName ?? null,
    estimatedCost: num(m.estimatedCost),
    actualCost: num(m.actualCost),
    reportedDate: m.reportedDate.toISOString(),
    scheduledDate: m.scheduledDate?.toISOString() ?? null,
    ageDays: ageDays(m.reportedDate),
  }));
}

interface MaintenanceCard {
  id: string;
  number: number;
  title: string;
  property: string;
  unit: string | null;
  priority: string;
  vendor: string | null;
  estimatedCost: number;
  reportedDate: string;
}

export async function getMaintenanceBoard() {
  const rows = await prisma.maintenanceRequest.findMany({
    where: { deletedAt: null },
    orderBy: { reportedDate: "desc" },
    include: {
      property: { select: { name: true } },
      unit: { select: { number: true } },
      vendor: { select: { companyName: true } },
    },
  });

  const board: Record<string, MaintenanceCard[]> = {};
  for (const status of MaintenanceStatusValues) board[status] = [];

  for (const m of rows) {
    (board[m.status] ??= []).push({
      id: m.id,
      number: m.number,
      title: m.title,
      property: m.property.name,
      unit: m.unit?.number ?? null,
      priority: m.priority,
      vendor: m.vendor?.companyName ?? null,
      estimatedCost: num(m.estimatedCost),
      reportedDate: m.reportedDate.toISOString(),
    });
  }
  return board;
}

export async function getMaintenance(id: string) {
  const request = await prisma.maintenanceRequest.findFirst({
    where: { id, deletedAt: null },
    include: {
      property: { select: { id: true, name: true } },
      unit: { select: { id: true, number: true } },
      tenant: { select: { id: true, firstName: true, lastName: true } },
      vendor: { select: { id: true, companyName: true } },
      documents: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
    },
  });
  return request;
}

function parse(formData: FormData) {
  return maintenanceSchema.safeParse({
    propertyId: formData.get("propertyId"),
    unitId: formData.get("unitId") || undefined,
    tenantId: formData.get("tenantId") || undefined,
    vendorId: formData.get("vendorId") || undefined,
    category: formData.get("category"),
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    status: formData.get("status"),
    estimatedCost: formData.get("estimatedCost") || undefined,
    actualCost: formData.get("actualCost") || undefined,
    scheduledDate: formData.get("scheduledDate") || undefined,
    completedDate: formData.get("completedDate") || undefined,
    internalNotes: formData.get("internalNotes"),
  });
}

export async function createMaintenance(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Please fix the errors and try again.", parsed.error.flatten().fieldErrors);
  }
  const d = parsed.data;
  const request = await prisma.maintenanceRequest.create({
    data: {
      propertyId: d.propertyId,
      unitId: d.unitId || null,
      tenantId: d.tenantId || null,
      vendorId: d.vendorId || null,
      category: d.category,
      title: d.title,
      description: d.description,
      priority: d.priority,
      status: d.status,
      estimatedCost: toNum(d.estimatedCost),
      actualCost: toNum(d.actualCost),
      scheduledDate: toDate(d.scheduledDate),
      completedDate: toDate(d.completedDate),
      internalNotes: d.internalNotes,
    },
  });
  await logActivity({
    action: "MAINTENANCE_CREATED", entityType: "MaintenanceRequest", entityId: request.id,
    summary: `Opened request #${request.number}: ${request.title}`,
    propertyId: request.propertyId, userId: user.id,
  });
  revalidatePath("/maintenance");
  revalidatePath("/dashboard");
  return ok({ id: request.id });
}

export async function updateMaintenance(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Please fix the errors and try again.", parsed.error.flatten().fieldErrors);
  }
  const d = parsed.data;
  const request = await prisma.maintenanceRequest.update({
    where: { id },
    data: {
      propertyId: d.propertyId,
      unitId: d.unitId || null,
      tenantId: d.tenantId || null,
      vendorId: d.vendorId || null,
      category: d.category,
      title: d.title,
      description: d.description,
      priority: d.priority,
      status: d.status,
      estimatedCost: toNum(d.estimatedCost),
      actualCost: toNum(d.actualCost),
      scheduledDate: toDate(d.scheduledDate),
      completedDate: toDate(d.completedDate),
      internalNotes: d.internalNotes,
    },
  });
  await logActivity({
    action: "MAINTENANCE_UPDATED", entityType: "MaintenanceRequest", entityId: id,
    summary: `Updated request #${request.number}: ${request.title}`,
    propertyId: request.propertyId, userId: user.id,
  });
  revalidatePath("/maintenance");
  revalidatePath(`/maintenance/${id}`);
  revalidatePath("/dashboard");
  return ok({ id });
}

export async function updateMaintenanceStatus(
  id: string,
  status: string,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  if (!MaintenanceStatusValues.includes(status as (typeof MaintenanceStatusValues)[number])) {
    return fail("Invalid status.");
  }
  const request = await prisma.maintenanceRequest.update({
    where: { id },
    data: {
      status: status as (typeof MaintenanceStatusValues)[number],
      completedDate: status === "COMPLETED" ? new Date() : undefined,
    },
  });
  await logActivity({
    action: "MAINTENANCE_STATUS_CHANGED", entityType: "MaintenanceRequest", entityId: id,
    summary: `Moved request #${request.number} to ${status}`,
    propertyId: request.propertyId, userId: user.id,
  });
  revalidatePath("/maintenance");
  revalidatePath(`/maintenance/${id}`);
  revalidatePath("/dashboard");
  return ok({ id });
}

export async function deleteMaintenance(id: string): Promise<ActionResult> {
  const user = await requireUser();
  await prisma.maintenanceRequest.update({ where: { id }, data: { deletedAt: new Date() } });
  await logActivity({
    action: "MAINTENANCE_DELETED", entityType: "MaintenanceRequest", entityId: id,
    summary: "Archived a maintenance request", userId: user.id,
  });
  revalidatePath("/maintenance");
  revalidatePath("/dashboard");
  return ok(undefined);
}

export async function getMaintenanceFormData() {
  const [properties, units, tenants, vendors] = await Promise.all([
    prisma.property.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.unit.findMany({
      where: { deletedAt: null },
      orderBy: { number: "asc" },
      select: { id: true, number: true, propertyId: true },
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
    units: units.map((u) => ({ value: u.id, label: u.number, propertyId: u.propertyId })),
    tenants: tenants.map((t) => ({ value: t.id, label: `${t.firstName} ${t.lastName}` })),
    vendors: vendors.map((v) => ({ value: v.id, label: v.companyName })),
  };
}
