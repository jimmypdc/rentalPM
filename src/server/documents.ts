"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fullName } from "@/lib/utils";
import { documentSchema } from "@/lib/validations/document";
import { logActivity } from "@/server/common";
import { ok, fail, type ActionResult } from "@/types";

// A sentinel used by the form's association <select>s for the "None" choice
// (Radix Select cannot hold an empty-string value).
const NONE = "NONE";
function norm(v: FormDataEntryValue | null): string | null {
  const s = v ? String(v).trim() : "";
  return s && s !== NONE ? s : null;
}

export async function listDocuments() {
  const documents = await prisma.document.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      property: { select: { name: true } },
      tenant: { select: { firstName: true, lastName: true } },
      owner: { select: { firstName: true, lastName: true, company: true } },
      vendor: { select: { companyName: true } },
      lease: { select: { id: true } },
    },
  });
  return documents.map((d) => {
    const related =
      d.property?.name ??
      (d.tenant ? fullName(d.tenant) : null) ??
      (d.owner ? d.owner.company ?? fullName(d.owner) : null) ??
      d.vendor?.companyName ??
      (d.lease ? "Lease" : null);
    return {
      id: d.id,
      name: d.name,
      category: d.category,
      related,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes ?? 0,
      createdAt: d.createdAt.toISOString(),
    };
  });
}

/** Option lists for the document form's association selects. */
export async function getDocumentFormData() {
  const [properties, tenants, owners, vendors, leases] = await Promise.all([
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
    prisma.owner.findMany({
      where: { deletedAt: null },
      orderBy: { lastName: "asc" },
      select: { id: true, firstName: true, lastName: true, company: true },
    }),
    prisma.vendor.findMany({
      where: { deletedAt: null },
      orderBy: { companyName: "asc" },
      select: { id: true, companyName: true },
    }),
    prisma.lease.findMany({
      where: { deletedAt: null },
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        property: { select: { name: true } },
        unit: { select: { number: true } },
      },
    }),
  ]);

  return {
    properties: properties.map((p) => ({ value: p.id, label: p.name })),
    tenants: tenants.map((t) => ({ value: t.id, label: fullName(t) })),
    owners: owners.map((o) => ({
      value: o.id,
      label: o.company ? `${fullName(o)} (${o.company})` : fullName(o),
    })),
    vendors: vendors.map((v) => ({ value: v.id, label: v.companyName })),
    leases: leases.map((l) => ({
      value: l.id,
      label: `${l.property.name} · Unit ${l.unit.number}`,
    })),
  };
}

function parse(formData: FormData) {
  return documentSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    propertyId: formData.get("propertyId"),
    tenantId: formData.get("tenantId"),
    leaseId: formData.get("leaseId"),
    ownerId: formData.get("ownerId"),
    vendorId: formData.get("vendorId"),
    notes: formData.get("notes"),
  });
}

export async function createDocument(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Please fix the errors and try again.", parsed.error.flatten().fieldErrors);
  }
  const d = parsed.data;
  const document = await prisma.document.create({
    data: {
      name: d.name,
      category: d.category,
      // File upload is out of scope — storage layer is abstracted, metadata only.
      storageKey: null,
      propertyId: norm(formData.get("propertyId")),
      tenantId: norm(formData.get("tenantId")),
      leaseId: norm(formData.get("leaseId")),
      ownerId: norm(formData.get("ownerId")),
      vendorId: norm(formData.get("vendorId")),
      uploadedById: user.id,
    },
  });
  await logActivity({
    action: "DOCUMENT_UPLOADED", entityType: "Document", entityId: document.id,
    summary: `Added document ${document.name}`, userId: user.id,
    propertyId: document.propertyId ?? undefined,
  });
  revalidatePath("/documents");
  return ok({ id: document.id });
}

export async function renameDocument(
  id: string,
  name: string,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const trimmed = name.trim();
  if (!trimmed) return fail("Name is required.");
  await prisma.document.update({ where: { id }, data: { name: trimmed } });
  await logActivity({
    action: "DOCUMENT_UPLOADED", entityType: "Document", entityId: id,
    summary: `Renamed document to ${trimmed}`, userId: user.id,
  });
  revalidatePath("/documents");
  return ok({ id });
}

export async function updateDocument(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Please fix the errors and try again.", parsed.error.flatten().fieldErrors);
  }
  const d = parsed.data;
  await prisma.document.update({
    where: { id },
    data: {
      name: d.name,
      category: d.category,
      propertyId: norm(formData.get("propertyId")),
      tenantId: norm(formData.get("tenantId")),
      leaseId: norm(formData.get("leaseId")),
      ownerId: norm(formData.get("ownerId")),
      vendorId: norm(formData.get("vendorId")),
    },
  });
  await logActivity({
    action: "DOCUMENT_UPLOADED", entityType: "Document", entityId: id,
    summary: `Updated document ${d.name}`, userId: user.id,
  });
  revalidatePath("/documents");
  return ok({ id });
}

export async function deleteDocument(id: string): Promise<ActionResult> {
  const user = await requireUser();
  await prisma.document.update({ where: { id }, data: { deletedAt: new Date() } });
  await logActivity({
    action: "DOCUMENT_UPLOADED", entityType: "Document", entityId: id,
    summary: "Archived a document", userId: user.id,
  });
  revalidatePath("/documents");
  return ok(undefined);
}
