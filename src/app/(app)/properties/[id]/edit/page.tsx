import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { num } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { PropertyForm } from "@/components/property/property-form";

export const metadata: Metadata = { title: "Edit Property" };
export const dynamic = "force-dynamic";

const money = (v: unknown): string => {
  const n = num(v as never);
  return n ? String(n) : "";
};

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await prisma.property.findFirst({ where: { id, deletedAt: null } });
  if (!p) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href={`/properties/${id}`} label="property" />
      <PageHeader title="Edit Property" description={p.name} />
      <PropertyForm
        initial={{
          id: p.id,
          name: p.name,
          type: p.type,
          status: p.status,
          street: p.street,
          city: p.city,
          state: p.state,
          zip: p.zip,
          county: p.county ?? "",
          purchaseDate: p.purchaseDate ? p.purchaseDate.toISOString().slice(0, 10) : "",
          purchasePrice: money(p.purchasePrice),
          estimatedValue: money(p.estimatedValue),
          propertyTaxAnnual: money(p.propertyTaxAnnual),
          insuranceAnnual: money(p.insuranceAnnual),
          hoaMonthly: money(p.hoaMonthly),
          squareFeet: p.squareFeet != null ? String(p.squareFeet) : "",
          yearBuilt: p.yearBuilt != null ? String(p.yearBuilt) : "",
          bedrooms: p.bedrooms != null ? String(p.bedrooms) : "",
          bathrooms: money(p.bathrooms),
          ownerEntity: p.ownerEntity ?? "",
          notes: p.notes ?? "",
        }}
      />
    </div>
  );
}
