import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { listTenants } from "@/server/tenants";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { TenantsTable } from "@/components/tenant/tenants-table";

export const metadata: Metadata = { title: "Tenants" };
export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  const tenants = await listTenants();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants"
        description="Current and past residents across your portfolio."
        actions={
          <Button asChild>
            <Link href="/tenants/new">
              <Plus className="h-4 w-4" /> Add Tenant
            </Link>
          </Button>
        }
      />
      <TenantsTable data={tenants} />
    </div>
  );
}
