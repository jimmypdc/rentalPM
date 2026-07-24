import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { listUnits } from "@/server/units";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { UnitsTable } from "@/components/unit/units-table";

export const metadata: Metadata = { title: "Units" };
export const dynamic = "force-dynamic";

export default async function UnitsPage() {
  const units = await listUnits();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Units"
        description="Every rentable unit across your properties."
        actions={
          <Button asChild>
            <Link href="/units/new">
              <Plus className="h-4 w-4" /> Add Unit
            </Link>
          </Button>
        }
      />
      <UnitsTable data={units} />
    </div>
  );
}
