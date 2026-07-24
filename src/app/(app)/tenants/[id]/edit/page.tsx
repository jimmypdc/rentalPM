import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { num } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { TenantForm } from "@/components/tenant/tenant-form";

export const metadata: Metadata = { title: "Edit Tenant" };
export const dynamic = "force-dynamic";

function ymd(d: Date | null | undefined): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

export default async function EditTenantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await prisma.tenant.findFirst({ where: { id, deletedAt: null } });
  if (!t) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href={`/tenants/${id}`} label="tenant" />
      <PageHeader title="Edit Tenant" description={`${t.firstName} ${t.lastName}`} />
      <TenantForm
        initial={{
          id: t.id,
          firstName: t.firstName,
          lastName: t.lastName,
          email: t.email ?? "",
          phone: t.phone ?? "",
          dateOfBirth: ymd(t.dateOfBirth),
          emergencyName: t.emergencyName ?? "",
          emergencyPhone: t.emergencyPhone ?? "",
          employer: t.employer ?? "",
          monthlyIncome: t.monthlyIncome ? String(num(t.monthlyIncome)) : "",
          vehicleInfo: t.vehicleInfo ?? "",
          pets: t.pets ?? "",
          notes: t.notes ?? "",
          status: t.status,
          moveInDate: ymd(t.moveInDate),
          moveOutDate: ymd(t.moveOutDate),
        }}
      />
    </div>
  );
}
