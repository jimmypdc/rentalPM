import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { OwnerForm } from "@/components/owner/owner-form";
import { BackLink } from "@/components/shared/back-link";

export const metadata: Metadata = { title: "Add Owner" };

export default function NewOwnerPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href="/owners" label="Owners" />
      <PageHeader title="Add Owner" description="Create a new property owner record." />
      <OwnerForm />
    </div>
  );
}
