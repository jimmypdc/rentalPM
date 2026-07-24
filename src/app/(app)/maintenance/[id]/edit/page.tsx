import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { num } from "@/lib/utils";
import { getMaintenanceFormData } from "@/server/maintenance";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { MaintenanceForm } from "@/components/maintenance/maintenance-form";

export const metadata: Metadata = { title: "Edit Request" };
export const dynamic = "force-dynamic";

export default async function EditMaintenancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [m, formData] = await Promise.all([
    prisma.maintenanceRequest.findFirst({ where: { id, deletedAt: null } }),
    getMaintenanceFormData(),
  ]);
  if (!m) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href={`/maintenance/${id}`} label="request" />
      <PageHeader title="Edit Request" description={`#${m.number} · ${m.title}`} />
      <MaintenanceForm
        {...formData}
        initial={{
          id: m.id,
          propertyId: m.propertyId,
          unitId: m.unitId ?? "",
          tenantId: m.tenantId ?? "",
          vendorId: m.vendorId ?? "",
          category: m.category,
          title: m.title,
          description: m.description ?? "",
          priority: m.priority,
          status: m.status,
          estimatedCost: m.estimatedCost ? String(num(m.estimatedCost)) : "",
          actualCost: m.actualCost ? String(num(m.actualCost)) : "",
          scheduledDate: m.scheduledDate ? m.scheduledDate.toISOString().slice(0, 10) : "",
          completedDate: m.completedDate ? m.completedDate.toISOString().slice(0, 10) : "",
          internalNotes: m.internalNotes ?? "",
        }}
      />
    </div>
  );
}
