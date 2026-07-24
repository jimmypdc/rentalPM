import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { ImportWizard } from "@/components/settings/import-wizard";

export const metadata: Metadata = { title: "CSV Import" };

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href="/settings" label="Settings" />
      <PageHeader
        title="CSV Import Wizard"
        description="Upload a CSV, map columns, validate, and import. Vendors import today; other entities preview only."
      />
      <ImportWizard />
    </div>
  );
}
