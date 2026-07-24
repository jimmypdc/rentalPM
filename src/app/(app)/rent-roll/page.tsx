import type { Metadata } from "next";
import { DollarSign, CheckCircle2, Wallet } from "lucide-react";
import { getRentRoll } from "@/server/rentRoll";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { RentRollTable } from "@/components/rentroll/rent-roll-table";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Rent Roll" };
export const dynamic = "force-dynamic";

export default async function RentRollPage() {
  const rows = await getRentRoll();

  const totalMonthlyCharges = rows.reduce((s, r) => s + r.totalMonthlyCharges, 0);
  const collected = rows.reduce((s, r) => s + r.amountPaidThisMonth, 0);
  const outstanding = rows.reduce((s, r) => s + r.outstandingBalance, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rent Roll"
        description="Scheduled charges, collections, and balances for every unit this month."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total Monthly Charges" value={formatCurrency(totalMonthlyCharges)} icon={DollarSign} accent="blue" />
        <StatCard label="Collected (MTD)" value={formatCurrency(collected)} icon={CheckCircle2} accent="green" />
        <StatCard label="Outstanding" value={formatCurrency(outstanding)} icon={Wallet} accent={outstanding > 0 ? "red" : "slate"} />
      </div>

      <RentRollTable data={rows} />
    </div>
  );
}
