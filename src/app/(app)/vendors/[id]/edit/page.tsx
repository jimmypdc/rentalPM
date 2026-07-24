import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { num } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { VendorForm } from "@/components/vendor/vendor-form";

export const metadata: Metadata = { title: "Edit Vendor" };
export const dynamic = "force-dynamic";

export default async function EditVendorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const v = await prisma.vendor.findFirst({ where: { id, deletedAt: null } });
  if (!v) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href={`/vendors/${id}`} label="vendor" />
      <PageHeader title="Edit Vendor" description={v.companyName} />
      <VendorForm
        initial={{
          id: v.id,
          companyName: v.companyName,
          contactName: v.contactName ?? "",
          category: v.category,
          email: v.email ?? "",
          phone: v.phone ?? "",
          street: v.street ?? "",
          city: v.city ?? "",
          state: v.state ?? "",
          zip: v.zip ?? "",
          website: v.website ?? "",
          licenseNumber: v.licenseNumber ?? "",
          insuranceExpiration: v.insuranceExpiration
            ? v.insuranceExpiration.toISOString().slice(0, 10)
            : "",
          wNineStatus: v.wNineStatus,
          preferred: v.preferred,
          hourlyRate: v.hourlyRate ? String(num(v.hourlyRate)) : "",
          notes: v.notes ?? "",
        }}
      />
    </div>
  );
}
