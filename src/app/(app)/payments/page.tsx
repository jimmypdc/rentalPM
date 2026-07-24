import Link from "next/link";
import type { Metadata } from "next";
import { Plus, DollarSign, Wallet, CalendarClock } from "lucide-react";
import { listPayments, getPaymentKpis } from "@/server/payments";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { PaymentsTable } from "@/components/payment/payments-table";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Rent & Payments" };
export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const [payments, kpis] = await Promise.all([listPayments(), getPaymentKpis()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rent & Payments"
        description="Record and track rent collection across your portfolio."
        actions={
          <Button asChild>
            <Link href="/payments/new">
              <Plus className="h-4 w-4" /> Record Payment
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Collected This Month" value={formatCurrency(kpis.collectedThisMonth)} icon={DollarSign} accent="green" />
        <StatCard label="Outstanding" value={formatCurrency(kpis.outstanding)} icon={Wallet} accent={kpis.outstanding > 0 ? "red" : "slate"} />
        <StatCard label="Expected This Month" value={formatCurrency(kpis.expectedThisMonth)} icon={CalendarClock} accent="blue" />
      </div>

      <PaymentsTable data={payments} />
    </div>
  );
}
