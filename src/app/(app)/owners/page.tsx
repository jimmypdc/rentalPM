import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { listOwners } from "@/server/owners";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { OwnersTable } from "@/components/owner/owners-table";

export const metadata: Metadata = { title: "Owners" };
export const dynamic = "force-dynamic";

export default async function OwnersPage() {
  const owners = await listOwners();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Owners"
        description="Property owners and their portfolios."
        actions={
          <Button asChild>
            <Link href="/owners/new">
              <Plus className="h-4 w-4" /> Add Owner
            </Link>
          </Button>
        }
      />
      <OwnersTable data={owners} />
    </div>
  );
}
