import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { listInspections } from "@/server/inspections";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { InspectionsTable } from "@/components/inspection/inspections-table";

export const metadata: Metadata = { title: "Inspections" };
export const dynamic = "force-dynamic";

export default async function InspectionsPage() {
  const inspections = await listInspections();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Inspections"
        description="Move-in, move-out, and routine property inspections."
        actions={
          <Button asChild>
            <Link href="/inspections/new">
              <Plus className="h-4 w-4" /> New Inspection
            </Link>
          </Button>
        }
      />
      <InspectionsTable data={inspections} />
    </div>
  );
}
