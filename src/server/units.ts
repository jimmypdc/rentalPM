"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { num, fullName } from "@/lib/utils";
import { unitSchema, type UnitInput } from "@/lib/validations/unit";
import { logActivity, toDate, toNum } from "@/server/common";
import { ok, fail, type ActionResult, type SelectOption } from "@/types";

const ACTIVE_LEASE = ["ACTIVE", "EXPIRING_SOON", "MONTH_TO_MONTH"] as const;

/** Coerce a form value to an integer or null (for Prisma Int columns). */
function toInt(v: string | null | undefined): number | null {
  const n = toNum(v);
  return n === null ? null : Math.trunc(n);
}

export async function listUnits() {
  const units = await prisma.unit.findMany({
    where: { deletedAt: null },
    orderBy: [{ property: { name: "asc" } }, { number: "asc" }],
    include: {
      property: { select: { id: true, name: true } },
      leases: {
        where: { status: { in: [...ACTIVE_LEASE] }, deletedAt: null },
        orderBy: { startDate: "desc" },
        take: 1,
        include: {
          tenants: {
            orderBy: { isPrimary: "desc" },
            include: { tenant: { select: { firstName: true, lastName: true } } },
          },
        },
      },
    },
  });

  return units.map((u) => {
    const lease = u.leases[0];
    const primary = lease?.tenants[0]?.tenant ?? null;
    return {
      id: u.id,
      number: u.number,
      propertyId: u.propertyId,
      propertyName: u.property.name,
      status: u.status,
      bedrooms: u.bedrooms,
      bathrooms: num(u.bathrooms),
      squareFeet: u.squareFeet,
      marketRent: num(u.marketRent),
      currentRent: num(u.currentRent),
      depositAmount: num(u.depositAmount),
      tenantName: primary ? fullName(primary) : null,
    };
  });
}

export async function getPropertyOptions(): Promise<SelectOption[]> {
  const properties = await prisma.property.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return properties.map((p) => ({ value: p.id, label: p.name }));
}

function parse(formData: FormData) {
  return unitSchema.safeParse({
    propertyId: formData.get("propertyId"),
    number: formData.get("number"),
    status: formData.get("status"),
    bedrooms: formData.get("bedrooms"),
    bathrooms: formData.get("bathrooms"),
    squareFeet: formData.get("squareFeet"),
    marketRent: formData.get("marketRent"),
    currentRent: formData.get("currentRent"),
    depositAmount: formData.get("depositAmount"),
    availableDate: formData.get("availableDate"),
    amenities: formData.get("amenities"),
    parking: formData.get("parking"),
    notes: formData.get("notes"),
  });
}

function toData(d: UnitInput) {
  return {
    number: d.number,
    status: d.status,
    bedrooms: toInt(d.bedrooms),
    bathrooms: toNum(d.bathrooms),
    squareFeet: toInt(d.squareFeet),
    marketRent: toNum(d.marketRent),
    currentRent: toNum(d.currentRent),
    depositAmount: toNum(d.depositAmount),
    availableDate: toDate(d.availableDate),
    amenities: d.amenities || null,
    parking: d.parking || null,
    notes: d.notes || null,
  };
}

export async function createUnit(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Please fix the errors and try again.", parsed.error.flatten().fieldErrors);
  }
  const d = parsed.data;
  const unit = await prisma.unit.create({
    data: { propertyId: d.propertyId, ...toData(d) },
  });
  await logActivity({
    action: "UNIT_CREATED", entityType: "Unit", entityId: unit.id,
    summary: `Added unit ${unit.number}`, propertyId: d.propertyId, userId: user.id,
  });
  revalidatePath("/units");
  revalidatePath(`/properties/${d.propertyId}`);
  return ok({ id: unit.id });
}

export async function updateUnit(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Please fix the errors and try again.", parsed.error.flatten().fieldErrors);
  }
  const d = parsed.data;
  const unit = await prisma.unit.update({
    where: { id },
    data: { propertyId: d.propertyId, ...toData(d) },
  });
  await logActivity({
    action: "UNIT_UPDATED", entityType: "Unit", entityId: id,
    summary: `Updated unit ${d.number}`, propertyId: unit.propertyId, userId: user.id,
  });
  revalidatePath("/units");
  revalidatePath(`/units/${id}/edit`);
  revalidatePath(`/properties/${unit.propertyId}`);
  return ok({ id });
}

export async function deleteUnit(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const unit = await prisma.unit.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await logActivity({
    action: "UNIT_DELETED", entityType: "Unit", entityId: id,
    summary: "Archived a unit", propertyId: unit.propertyId, userId: user.id,
  });
  revalidatePath("/units");
  revalidatePath(`/properties/${unit.propertyId}`);
  return ok(undefined);
}
