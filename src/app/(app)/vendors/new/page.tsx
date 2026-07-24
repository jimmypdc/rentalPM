import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { VendorForm } from "@/components/vendor/vendor-form";
import { BackLink } from "@/components/shared/back-link";

export const metadata: Metadata = { title: "Add Vendor" };

export default function NewVendorPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href="/vendors" label="Vendors" />
      <PageHeader title="Add Vendor" description="Create a new vendor or contractor record." />
      <VendorForm />
    </div>
  );
}
