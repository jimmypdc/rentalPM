import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { TenantForm } from "@/components/tenant/tenant-form";
import { BackLink } from "@/components/shared/back-link";

export const metadata: Metadata = { title: "Add Tenant" };

export default function NewTenantPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href="/tenants" label="Tenants" />
      <PageHeader title="Add Tenant" description="Create a new tenant record." />
      <TenantForm />
    </div>
  );
}
