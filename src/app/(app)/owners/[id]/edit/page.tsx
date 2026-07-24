import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { num } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { OwnerForm } from "@/components/owner/owner-form";

export const metadata: Metadata = { title: "Edit Owner" };
export const dynamic = "force-dynamic";

export default async function EditOwnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const o = await prisma.owner.findFirst({ where: { id, deletedAt: null } });
  if (!o) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href={`/owners/${id}`} label="owner" />
      <PageHeader title="Edit Owner" description={`${o.firstName} ${o.lastName}`} />
      <OwnerForm
        initial={{
          id: o.id,
          firstName: o.firstName,
          lastName: o.lastName,
          company: o.company ?? "",
          email: o.email ?? "",
          phone: o.phone ?? "",
          street: o.street ?? "",
          city: o.city ?? "",
          state: o.state ?? "",
          zip: o.zip ?? "",
          contactMethod: o.contactMethod,
          isSelf: o.isSelf,
          taxId: o.taxId ?? "",
          paymentInfo: o.paymentInfo ?? "",
          managementFeePercent: o.managementFeePercent ? String(num(o.managementFeePercent)) : "",
          notes: o.notes ?? "",
        }}
      />
    </div>
  );
}
