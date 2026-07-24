import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { listProperties } from "@/server/properties";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PropertiesTable } from "@/components/property/properties-table";

export const metadata: Metadata = { title: "Properties" };
export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const properties = await listProperties();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Properties"
        description="Every property in your portfolio, with units and rent at a glance."
        actions={
          <Button asChild>
            <Link href="/properties/new">
              <Plus className="h-4 w-4" /> Add Property
            </Link>
          </Button>
        }
      />
      <PropertiesTable data={properties} />
    </div>
  );
}
