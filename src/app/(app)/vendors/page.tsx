import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { listVendors } from "@/server/vendors";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { VendorsTable } from "@/components/vendor/vendors-table";

export const metadata: Metadata = { title: "Vendors" };
export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const vendors = await listVendors();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors"
        description="Contractors and service providers across your portfolio."
        actions={
          <Button asChild>
            <Link href="/vendors/new">
              <Plus className="h-4 w-4" /> Add Vendor
            </Link>
          </Button>
        }
      />
      <VendorsTable data={vendors} />
    </div>
  );
}
