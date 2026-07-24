import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { DepositForm } from "@/components/deposit/deposit-form";
import { getDepositFormData } from "@/server/deposits";

export const metadata: Metadata = { title: "Add Deposit" };
export const dynamic = "force-dynamic";

export default async function NewDepositPage() {
  const { leases, tenants } = await getDepositFormData();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href="/deposits" label="Security Deposits" />
      <PageHeader title="Add Deposit" description="Record a security deposit for a lease." />
      <DepositForm leases={leases} tenants={tenants} />
    </div>
  );
}
