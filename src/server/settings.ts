"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/server/common";
import { VendorCategoryValues } from "@/lib/enums";
import { ok, fail, type ActionResult } from "@/types";

export async function updateProfile(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name) {
    return fail("Name is required.", { name: ["Name is required"] });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name, phone: phone || null },
  });

  await logActivity({
    action: "USER_UPDATED", entityType: "User", entityId: user.id,
    summary: "Updated profile", userId: user.id,
  });

  revalidatePath("/settings");
  return ok({ id: user.id });
}

export interface VendorImportRow {
  companyName?: string;
  contactName?: string;
  category?: string;
  email?: string;
  phone?: string;
}

/**
 * Commit a batch of vendor rows from the CSV import wizard. Only Vendors is wired
 * for now — other entities are stubbed in the UI as "Coming soon".
 */
export async function importVendors(
  rows: VendorImportRow[],
): Promise<ActionResult<{ imported: number; skipped: number }>> {
  const user = await requireUser();
  if (!Array.isArray(rows) || rows.length === 0) {
    return fail("No rows to import.");
  }

  const valid = VendorCategoryValues as readonly string[];
  const data = rows
    .map((r) => ({
      companyName: (r.companyName ?? "").trim(),
      contactName: (r.contactName ?? "").trim() || null,
      category: valid.includes((r.category ?? "").trim().toUpperCase())
        ? ((r.category ?? "").trim().toUpperCase() as (typeof VendorCategoryValues)[number])
        : ("OTHER" as const),
      email: (r.email ?? "").trim() || null,
      phone: (r.phone ?? "").trim() || null,
    }))
    .filter((r) => r.companyName.length > 0);

  const skipped = rows.length - data.length;
  if (data.length === 0) {
    return fail("No valid rows — every row needs a company name.");
  }

  await prisma.vendor.createMany({ data });

  await logActivity({
    action: "VENDOR_CREATED", entityType: "Vendor",
    summary: `Imported ${data.length} vendors via CSV`, userId: user.id,
  });

  revalidatePath("/vendors");
  return ok({ imported: data.length, skipped });
}
