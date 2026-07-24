import type { Metadata } from "next";
import { getInspectionFormData } from "@/server/inspections";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { InspectionForm } from "@/components/inspection/inspection-form";

export const metadata: Metadata = { title: "New Inspection" };
export const dynamic = "force-dynamic";

export default async function NewInspectionPage() {
  const formData = await getInspectionFormData();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href="/inspections" label="Inspections" />
      <PageHeader
        title="New Inspection"
        description="A default room-by-room checklist is created automatically."
      />
      <InspectionForm {...formData} />
    </div>
  );
}
