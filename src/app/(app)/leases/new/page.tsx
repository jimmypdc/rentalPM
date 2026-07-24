import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { LeaseForm } from "@/components/lease/lease-form";
import { getLeaseFormData } from "@/server/leases";

export const metadata: Metadata = { title: "Add Lease" };
export const dynamic = "force-dynamic";

export default async function NewLeasePage() {
  const { units, tenants } = await getLeaseFormData();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href="/leases" label="Leases" />
      <PageHeader title="Add Lease" description="Create a new lease and its primary tenant." />
      <LeaseForm units={units} tenants={tenants} />
    </div>
  );
}
