import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { num } from "@/lib/utils";
import { getPropertyOptions } from "@/server/units";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { UnitForm } from "@/components/unit/unit-form";

export const metadata: Metadata = { title: "Edit Unit" };
export const dynamic = "force-dynamic";

const money = (v: unknown): string => {
  const n = num(v as never);
  return n ? String(n) : "";
};

export default async function EditUnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [u, properties] = await Promise.all([
    prisma.unit.findFirst({
      where: { id, deletedAt: null },
      include: { property: { select: { name: true } } },
    }),
    getPropertyOptions(),
  ]);
  if (!u) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href="/units" label="Units" />
      <PageHeader title="Edit Unit" description={`${u.property.name} · ${u.number}`} />
      <UnitForm
        properties={properties}
        initial={{
          id: u.id,
          propertyId: u.propertyId,
          number: u.number,
          status: u.status,
          bedrooms: u.bedrooms != null ? String(u.bedrooms) : "",
          bathrooms: money(u.bathrooms),
          squareFeet: u.squareFeet != null ? String(u.squareFeet) : "",
          marketRent: money(u.marketRent),
          currentRent: money(u.currentRent),
          depositAmount: money(u.depositAmount),
          availableDate: u.availableDate ? u.availableDate.toISOString().slice(0, 10) : "",
          amenities: u.amenities ?? "",
          parking: u.parking ?? "",
          notes: u.notes ?? "",
        }}
      />
    </div>
  );
}
