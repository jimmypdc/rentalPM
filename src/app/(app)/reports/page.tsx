import type { Metadata } from "next";
import { Building2, FileText, CircleDollarSign, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ReportCatalog } from "@/components/report/report-catalog";
import { getReportsSummary } from "@/server/reports";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const summary = await getReportsSummary();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Financial and operational reports across your portfolio. Export to CSV or print any report."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Properties" value={summary.properties} icon={Building2} accent="blue" />
        <StatCard label="Active Leases" value={summary.activeLeases} icon={FileText} accent="purple" />
        <StatCard
          label="Monthly Rent"
          value={formatCurrency(summary.monthlyRent)}
          icon={CircleDollarSign}
          accent="green"
        />
        <StatCard
          label="Open Balance"
          value={formatCurrency(summary.openBalance)}
          icon={AlertTriangle}
          accent={summary.openBalance > 0 ? "red" : "slate"}
        />
      </div>

      <ReportCatalog />
    </div>
  );
}
