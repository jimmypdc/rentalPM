import Link from "next/link";
import type { Metadata } from "next";
import { Plus, Landmark } from "lucide-react";
import { listDeposits } from "@/server/deposits";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { DepositsTable } from "@/components/deposit/deposits-table";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Security Deposits" };
export const dynamic = "force-dynamic";

export default async function DepositsPage() {
  const deposits = await listDeposits();
  const held = deposits
    .filter((d) => d.status === "HELD" || d.status === "PARTIALLY_REFUNDED")
    .reduce((s, d) => s + d.amount - d.refundAmount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Deposits"
        description="Deposits held, refunded, and applied across your leases."
        actions={
          <Button asChild>
            <Link href="/deposits/new">
              <Plus className="h-4 w-4" /> Add Deposit
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total Held" value={formatCurrency(held)} icon={Landmark} accent="blue" />
      </div>

      <DepositsTable data={deposits} />
    </div>
  );
}
