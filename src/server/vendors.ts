"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { num } from "@/lib/utils";
import { vendorSchema } from "@/lib/validations/vendor";
import { logActivity, toDate, toNum } from "@/server/common";
import { ok, fail, type ActionResult } from "@/types";

const OPEN_MAINT = [
  "NEW", "ASSIGNED", "SCHEDULED", "IN_PROGRESS", "WAITING_ON_PARTS", "WAITING_ON_VENDOR",
] as const;

export async function listVendors() {
  const vendors = await prisma.vendor.findMany({
    where: { deletedAt: null },
    orderBy: { companyName: "asc" },
    include: {
      _count: { select: { maintenanceRequests: true, expenses: true } },
      expenses: { where: { voidedAt: null }, select: { amount: true } },
    },
  });
  return vendors.map((v) => ({
    id: v.id,
    companyName: v.companyName,
    contactName: v.contactName,
    category: v.category,
    email: v.email,
    phone: v.phone,
    preferred: v.preferred,
    wNineStatus: v.wNineStatus,
    insuranceExpiration: v.insuranceExpiration?.toISOString() ?? null,
    hourlyRate: num(v.hourlyRate),
    jobs: v._count.maintenanceRequests,
    totalSpend: v.expenses.reduce((s, e) => s + num(e.amount), 0),
  }));
}

export async function getVendor(id: string) {
  const vendor = await prisma.vendor.findFirst({
    where: { id, deletedAt: null },
    include: {
      maintenanceRequests: {
        orderBy: { reportedDate: "desc" },
        include: { property: { select: { name: true } }, unit: { select: { number: true } } },
      },
      expenses: {
        where: { voidedAt: null },
        orderBy: { date: "desc" },
        include: { property: { select: { name: true } } },
      },
      documents: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!vendor) return null;

  const totalSpend = vendor.expenses.reduce((s, e) => s + num(e.amount), 0);
  const completedJobs = vendor.maintenanceRequests.filter((m) => m.status === "COMPLETED");
  const openWorkOrders = vendor.maintenanceRequests.filter((m) =>
    OPEN_MAINT.includes(m.status as (typeof OPEN_MAINT)[number]),
  ).length;
  const jobCosts = vendor.maintenanceRequests
    .map((m) => num(m.actualCost))
    .filter((c) => c > 0);
  const avgJobCost = jobCosts.length
    ? jobCosts.reduce((s, c) => s + c, 0) / jobCosts.length
    : 0;
  const propertiesServiced = new Set(
    vendor.maintenanceRequests.map((m) => m.property.name),
  ).size;

  return {
    vendor,
    stats: {
      totalSpend,
      completedJobs: completedJobs.length,
      openWorkOrders,
      avgJobCost,
      propertiesServiced,
      totalJobs: vendor.maintenanceRequests.length,
    },
  };
}

function parse(formData: FormData) {
  return vendorSchema.safeParse({
    companyName: formData.get("companyName"),
    contactName: formData.get("contactName"),
    category: formData.get("category"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    street: formData.get("street"),
    city: formData.get("city"),
    state: formData.get("state"),
    zip: formData.get("zip"),
    website: formData.get("website"),
    licenseNumber: formData.get("licenseNumber"),
    insuranceExpiration: formData.get("insuranceExpiration"),
    wNineStatus: formData.get("wNineStatus"),
    preferred: formData.get("preferred") === "true" || formData.get("preferred") === "on",
    hourlyRate: formData.get("hourlyRate") || undefined,
    notes: formData.get("notes"),
  });
}

export async function createVendor(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Please fix the errors and try again.", parsed.error.flatten().fieldErrors);
  }
  const d = parsed.data;
  const vendor = await prisma.vendor.create({
    data: {
      companyName: d.companyName,
      contactName: d.contactName,
      category: d.category,
      email: d.email || null,
      phone: d.phone,
      street: d.street,
      city: d.city,
      state: d.state,
      zip: d.zip,
      website: d.website,
      licenseNumber: d.licenseNumber,
      insuranceExpiration: toDate(d.insuranceExpiration),
      wNineStatus: d.wNineStatus,
      preferred: d.preferred,
      hourlyRate: toNum(d.hourlyRate),
      notes: d.notes,
    },
  });
  await logActivity({
    action: "VENDOR_CREATED", entityType: "Vendor", entityId: vendor.id,
    summary: `Added vendor ${vendor.companyName}`, userId: user.id,
  });
  revalidatePath("/vendors");
  return ok({ id: vendor.id });
}

export async function updateVendor(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Please fix the errors and try again.", parsed.error.flatten().fieldErrors);
  }
  const d = parsed.data;
  await prisma.vendor.update({
    where: { id },
    data: {
      companyName: d.companyName,
      contactName: d.contactName,
      category: d.category,
      email: d.email || null,
      phone: d.phone,
      street: d.street,
      city: d.city,
      state: d.state,
      zip: d.zip,
      website: d.website,
      licenseNumber: d.licenseNumber,
      insuranceExpiration: toDate(d.insuranceExpiration),
      wNineStatus: d.wNineStatus,
      preferred: d.preferred,
      hourlyRate: toNum(d.hourlyRate),
      notes: d.notes,
    },
  });
  await logActivity({
    action: "VENDOR_UPDATED", entityType: "Vendor", entityId: id,
    summary: `Updated vendor ${d.companyName}`, userId: user.id,
  });
  revalidatePath("/vendors");
  revalidatePath(`/vendors/${id}`);
  return ok({ id });
}

export async function deleteVendor(id: string): Promise<ActionResult> {
  const user = await requireUser();
  await prisma.vendor.update({ where: { id }, data: { deletedAt: new Date() } });
  await logActivity({
    action: "VENDOR_DELETED", entityType: "Vendor", entityId: id,
    summary: "Archived a vendor", userId: user.id,
  });
  revalidatePath("/vendors");
  return ok(undefined);
}
