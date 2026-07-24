import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { PaymentForm } from "@/components/payment/payment-form";
import { getPaymentFormData } from "@/server/payments";

export const metadata: Metadata = { title: "Record Payment" };
export const dynamic = "force-dynamic";

export default async function NewPaymentPage() {
  const { tenants, openCharges } = await getPaymentFormData();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href="/payments" label="Rent & Payments" />
      <PageHeader title="Record Payment" description="Log a rent or other payment and optionally apply it to an open charge." />
      <PaymentForm tenants={tenants} openCharges={openCharges} />
    </div>
  );
}
