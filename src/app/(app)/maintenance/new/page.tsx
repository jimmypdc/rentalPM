import type { Metadata } from "next";
import { getMaintenanceFormData } from "@/server/maintenance";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { MaintenanceForm } from "@/components/maintenance/maintenance-form";

export const metadata: Metadata = { title: "New Request" };
export const dynamic = "force-dynamic";

export default async function NewMaintenancePage() {
  const formData = await getMaintenanceFormData();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href="/maintenance" label="Maintenance" />
      <PageHeader title="New Request" description="Open a maintenance work order." />
      <MaintenanceForm {...formData} />
    </div>
  );
}
