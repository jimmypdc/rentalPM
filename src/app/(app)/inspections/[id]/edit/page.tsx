import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getInspectionFormData } from "@/server/inspections";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { InspectionForm } from "@/components/inspection/inspection-form";

export const metadata: Metadata = { title: "Edit Inspection" };
export const dynamic = "force-dynamic";

export default async function EditInspectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [i, formData] = await Promise.all([
    prisma.inspection.findFirst({ where: { id, deletedAt: null } }),
    getInspectionFormData(),
  ]);
  if (!i) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href={`/inspections/${id}`} label="inspection" />
      <PageHeader title="Edit Inspection" description={`${i.type} inspection`} />
      <InspectionForm
        {...formData}
        initial={{
          id: i.id,
          propertyId: i.propertyId,
          unitId: i.unitId ?? "",
          tenantId: i.tenantId ?? "",
          type: i.type,
          inspectionDate: i.inspectionDate ? i.inspectionDate.toISOString().slice(0, 10) : "",
          inspector: i.inspector ?? "",
          conditionRating: i.conditionRating,
          notes: i.notes ?? "",
          issuesFound: i.issuesFound ?? "",
          followUpRequired: i.followUpRequired,
          nextInspectionDate: i.nextInspectionDate ? i.nextInspectionDate.toISOString().slice(0, 10) : "",
        }}
      />
    </div>
  );
}
