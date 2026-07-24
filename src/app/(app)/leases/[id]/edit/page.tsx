import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { num } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { LeaseForm } from "@/components/lease/lease-form";
import { getLeaseFormData } from "@/server/leases";

export const metadata: Metadata = { title: "Edit Lease" };
export const dynamic = "force-dynamic";

const iso = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");

export default async function EditLeasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [lease, formData] = await Promise.all([
    prisma.lease.findFirst({
      where: { id, deletedAt: null },
      include: {
        property: { select: { name: true } },
        unit: { select: { number: true } },
        tenants: { orderBy: { isPrimary: "desc" }, select: { tenantId: true, isPrimary: true } },
      },
    }),
    getLeaseFormData(),
  ]);
  if (!lease) notFound();

  const primary = lease.tenants.find((t) => t.isPrimary) ?? lease.tenants[0];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href={`/leases/${id}`} label="lease" />
      <PageHeader title="Edit Lease" description={`${lease.property.name} · Unit ${lease.unit.number}`} />
      <LeaseForm
        units={formData.units}
        tenants={formData.tenants}
        initial={{
          id: lease.id,
          propertyId: lease.propertyId,
          unitId: lease.unitId,
          tenantId: primary?.tenantId ?? "",
          startDate: iso(lease.startDate),
          endDate: iso(lease.endDate),
          rent: String(num(lease.rent)),
          securityDeposit: lease.securityDeposit ? String(num(lease.securityDeposit)) : "",
          petDeposit: lease.petDeposit ? String(num(lease.petDeposit)) : "",
          otherDeposit: lease.otherDeposit ? String(num(lease.otherDeposit)) : "",
          lateFee: lease.lateFee ? String(num(lease.lateFee)) : "",
          gracePeriodDays: String(lease.gracePeriodDays),
          rentDueDay: String(lease.rentDueDay),
          status: lease.status,
          renewalStatus: lease.renewalStatus,
          moveInDate: iso(lease.moveInDate),
          moveOutDate: iso(lease.moveOutDate),
          notes: lease.notes ?? "",
        }}
      />
    </div>
  );
}
