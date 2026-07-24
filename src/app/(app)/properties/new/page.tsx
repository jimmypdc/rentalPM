import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { PropertyForm } from "@/components/property/property-form";
import { BackLink } from "@/components/shared/back-link";

export const metadata: Metadata = { title: "Add Property" };

export default function NewPropertyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href="/properties" label="Properties" />
      <PageHeader title="Add Property" description="Create a new property record." />
      <PropertyForm />
    </div>
  );
}
