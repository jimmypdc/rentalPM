import type { Metadata } from "next";
import { getPropertyOptions } from "@/server/units";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { UnitForm } from "@/components/unit/unit-form";

export const metadata: Metadata = { title: "Add Unit" };
export const dynamic = "force-dynamic";

export default async function NewUnitPage() {
  const properties = await getPropertyOptions();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href="/units" label="Units" />
      <PageHeader title="Add Unit" description="Create a new rentable unit." />
      <UnitForm properties={properties} />
    </div>
  );
}
