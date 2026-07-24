"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { inspectionSchema } from "@/lib/validations/inspection";
import { logActivity, toDate } from "@/server/common";
import { ok, fail, type ActionResult } from "@/types";

const DEFAULT_CHECKLIST = [
  "Walls", "Floors", "Ceilings", "Windows", "Doors", "Kitchen", "Bathrooms",
  "HVAC", "Plumbing", "Electrical", "Appliances", "Smoke Detectors", "Exterior",
  "Roof", "Landscaping",
];

export async function listInspections() {
  const rows = await prisma.inspection.findMany({
    where: { deletedAt: null },
    orderBy: { inspectionDate: "desc" },
    include: {
      property: { select: { name: true } },
      unit: { select: { number: true } },
      _count: { select: { items: true } },
    },
  });
  return rows.map((i) => ({
    id: i.id,
    property: i.property.name,
    unit: i.unit?.number ?? null,
    type: i.type,
    inspectionDate: i.inspectionDate.toISOString(),
    inspector: i.inspector,
    conditionRating: i.conditionRating,
    followUpRequired: i.followUpRequired,
    itemCount: i._count.items,
    nextInspectionDate: i.nextInspectionDate?.toISOString() ?? null,
  }));
}

export async function getInspection(id: string) {
  const inspection = await prisma.inspection.findFirst({
    where: { id, deletedAt: null },
    include: {
      property: { select: { id: true, name: true } },
      unit: { select: { id: true, number: true } },
      tenant: { select: { id: true, firstName: true, lastName: true } },
      items: { orderBy: { area: "asc" } },
      documents: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
    },
  });
  return inspection;
}

function parse(formData: FormData) {
  return inspectionSchema.safeParse({
    propertyId: formData.get("propertyId"),
    unitId: formData.get("unitId") || undefined,
    tenantId: formData.get("tenantId") || undefined,
    type: formData.get("type"),
    inspectionDate: formData.get("inspectionDate"),
    inspector: formData.get("inspector"),
    conditionRating: formData.get("conditionRating"),
    notes: formData.get("notes"),
    issuesFound: formData.get("issuesFound"),
    followUpRequired:
      formData.get("followUpRequired") === "true" || formData.get("followUpRequired") === "on",
    nextInspectionDate: formData.get("nextInspectionDate") || undefined,
  });
}

export async function createInspection(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Please fix the errors and try again.", parsed.error.flatten().fieldErrors);
  }
  const d = parsed.data;
  const inspection = await prisma.inspection.create({
    data: {
      propertyId: d.propertyId,
      unitId: d.unitId || null,
      tenantId: d.tenantId || null,
      type: d.type,
      inspectionDate: toDate(d.inspectionDate) ?? new Date(),
      inspector: d.inspector,
      conditionRating: d.conditionRating,
      notes: d.notes,
      issuesFound: d.issuesFound,
      followUpRequired: d.followUpRequired,
      nextInspectionDate: toDate(d.nextInspectionDate),
      items: {
        create: DEFAULT_CHECKLIST.map((area) => ({ area, rating: "GOOD" as const })),
      },
    },
  });
  await logActivity({
    action: "INSPECTION_CREATED", entityType: "Inspection", entityId: inspection.id,
    summary: `Logged inspection for property`,
    propertyId: inspection.propertyId, userId: user.id,
  });
  revalidatePath("/inspections");
  revalidatePath("/dashboard");
  return ok({ id: inspection.id });
}

export async function updateInspection(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Please fix the errors and try again.", parsed.error.flatten().fieldErrors);
  }
  const d = parsed.data;
  const inspection = await prisma.inspection.update({
    where: { id },
    data: {
      propertyId: d.propertyId,
      unitId: d.unitId || null,
      tenantId: d.tenantId || null,
      type: d.type,
      inspectionDate: toDate(d.inspectionDate) ?? new Date(),
      inspector: d.inspector,
      conditionRating: d.conditionRating,
      notes: d.notes,
      issuesFound: d.issuesFound,
      followUpRequired: d.followUpRequired,
      nextInspectionDate: toDate(d.nextInspectionDate),
    },
  });
  await logActivity({
    action: "INSPECTION_UPDATED", entityType: "Inspection", entityId: id,
    summary: `Updated inspection`,
    propertyId: inspection.propertyId, userId: user.id,
  });
  revalidatePath("/inspections");
  revalidatePath(`/inspections/${id}`);
  revalidatePath("/dashboard");
  return ok({ id });
}

export async function deleteInspection(id: string): Promise<ActionResult> {
  const user = await requireUser();
  await prisma.inspection.update({ where: { id }, data: { deletedAt: new Date() } });
  await logActivity({
    action: "INSPECTION_DELETED", entityType: "Inspection", entityId: id,
    summary: "Archived an inspection", userId: user.id,
  });
  revalidatePath("/inspections");
  revalidatePath("/dashboard");
  return ok(undefined);
}

export async function getInspectionFormData() {
  const [properties, units, tenants] = await Promise.all([
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
  ]);
  return {
    properties: properties.map((p) => ({ value: p.id, label: p.name })),
    units: units.map((u) => ({ value: u.id, label: u.number, propertyId: u.propertyId })),
    tenants: tenants.map((t) => ({ value: t.id, label: `${t.firstName} ${t.lastName}` })),
  };
}
