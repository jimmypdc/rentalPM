import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { Card } from "@/components/ui/card";
import { PerformanceChart } from "@/components/shared/charts";
import { ReportTable, type ReportColumn, type ReportRow } from "@/components/report/report-table";
import { REPORTS } from "@/lib/reports-catalog";
import { formatCurrency } from "@/lib/utils";
import {
  rentRollReport,
  incomeStatementReport,
  cashFlowReport,
  delinquencyReport,
  leaseExpirationReport,
  occupancyReport,
  maintenanceCostReport,
  vendorSpendReport,
  expenseReport,
  securityDepositReport,
  propertyPerformanceReport,
} from "@/server/reports";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = REPORTS.find((r) => r.slug === slug);
  return { title: meta ? `${meta.title} · Reports` : "Report" };
}

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { slug } = await params;
  const { period } = await searchParams;
  const meta = REPORTS.find((r) => r.slug === slug);

  return (
    <div className="space-y-6">
      <BackLink href="/reports" label="Reports" />
      <PageHeader
        title={meta?.title ?? "Report"}
        description={meta?.description}
      />
      {await renderReport(slug, period)}
    </div>
  );
}

async function renderReport(slug: string, period?: string) {
  switch (slug) {
    case "rent-roll": {
      const { rows, totals } = await rentRollReport();
      const columns: ReportColumn[] = [
        { key: "property", header: "Property" },
        { key: "unit", header: "Unit" },
        { key: "tenant", header: "Tenant" },
        { key: "rent", header: "Rent", format: "money", align: "right" },
        { key: "paid", header: "Paid", format: "money", align: "right" },
        { key: "balance", header: "Balance", format: "money", align: "right" },
        { key: "status", header: "Status", format: "badge" },
      ];
      return (
        <ReportTable
          title="Rent Roll"
          columns={columns}
          rows={rows.map((r) => ({ ...r, _href: `/leases/${r.id}` }))}
          totals={{ property: "", rent: totals.rent, paid: totals.paid, balance: totals.balance }}
          exportFilename="rent-roll"
          hrefKey="_href"
        />
      );
    }

    case "income-statement":
    case "property-pnl": {
      const data = await incomeStatementReport(period);
      const incomeCols: ReportColumn[] = [
        { key: "label", header: "Income" },
        { key: "amount", header: "Amount", format: "money", align: "right" },
      ];
      const expenseCols: ReportColumn[] = [
        { key: "label", header: "Expense Category" },
        { key: "amount", header: "Amount", format: "money", align: "right" },
      ];
      return (
        <div className="space-y-6">
          <PeriodNote period={data.period} slug={slug} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Income" value={formatCurrency(data.totalIncome)} accent="green" />
            <StatCard label="Total Expenses" value={formatCurrency(data.totalExpenses)} accent="amber" />
            <StatCard label="NOI" value={formatCurrency(data.noi)} accent="blue" hint="Excludes debt service & capex" />
            <StatCard label="Net Income" value={formatCurrency(data.netIncome)} accent={data.netIncome >= 0 ? "green" : "red"} />
          </div>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Income</h2>
            <ReportTable
              title="Income"
              columns={incomeCols}
              rows={data.income.map((r) => ({ label: r.label, amount: r.amount }))}
              totals={{ label: "", amount: data.totalIncome }}
              exportFilename={`${slug}-income`}
              searchable={false}
            />
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Expenses</h2>
            <ReportTable
              title="Expenses"
              columns={expenseCols}
              rows={data.expenses.map((r) => ({ label: r.label, amount: r.amount }))}
              totals={{ label: "", amount: data.totalExpenses }}
              exportFilename={`${slug}-expenses`}
              searchable={false}
            />
          </section>
        </div>
      );
    }

    case "cash-flow": {
      const { rows, totals } = await cashFlowReport();
      const columns: ReportColumn[] = [
        { key: "month", header: "Month" },
        { key: "income", header: "Income", format: "money", align: "right" },
        { key: "expenses", header: "Expenses", format: "money", align: "right" },
        { key: "net", header: "Net Cash Flow", format: "money", align: "right" },
      ];
      return (
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">12-Month Cash Flow</h2>
            <PerformanceChart data={rows} />
          </Card>
          <ReportTable
            title="Cash Flow"
            columns={columns}
            rows={rows as unknown as ReportRow[]}
            totals={{ month: "", income: totals.income, expenses: totals.expenses, net: totals.net }}
            exportFilename="cash-flow"
            searchable={false}
          />
        </div>
      );
    }

    case "expense-report": {
      const { rows, totals, period: periodLabel } = await expenseReport(period);
      const columns: ReportColumn[] = [
        { key: "category", header: "Category" },
        { key: "count", header: "Count", format: "number", align: "right" },
        { key: "amount", header: "Amount", format: "money", align: "right" },
      ];
      return (
        <div className="space-y-4">
          <PeriodNote period={periodLabel} slug={slug} />
          <ReportTable
            title="Expense Report"
            columns={columns}
            rows={rows as ReportRow[]}
            totals={{ category: "", count: totals.count, amount: totals.amount }}
            exportFilename="expense-report"
            searchable={false}
          />
        </div>
      );
    }

    case "delinquency": {
      const { rows, totals } = await delinquencyReport();
      const columns: ReportColumn[] = [
        { key: "tenant", header: "Tenant" },
        { key: "property", header: "Property" },
        { key: "unit", header: "Unit" },
        { key: "amount", header: "Amount Overdue", format: "money", align: "right" },
        { key: "daysLate", header: "Days Late", format: "number", align: "right" },
      ];
      return (
        <ReportTable
          title="Delinquency"
          columns={columns}
          rows={rows.map((r) => ({ ...r, _href: `/leases/${r.id}` }))}
          totals={{ tenant: "", amount: totals.amount }}
          exportFilename="delinquency"
          hrefKey="_href"
        />
      );
    }

    case "lease-expiration": {
      const { rows } = await leaseExpirationReport();
      const columns: ReportColumn[] = [
        { key: "property", header: "Property" },
        { key: "unit", header: "Unit" },
        { key: "tenant", header: "Tenant" },
        { key: "rent", header: "Rent", format: "money", align: "right" },
        { key: "endDate", header: "End Date", format: "date" },
        { key: "daysUntil", header: "Days Until", format: "number", align: "right" },
        { key: "bucket", header: "Alert" },
      ];
      return (
        <ReportTable
          title="Lease Expiration"
          columns={columns}
          rows={rows.map((r) => ({ ...r, _href: `/leases/${r.id}` }))}
          exportFilename="lease-expiration"
          hrefKey="_href"
        />
      );
    }

    case "occupancy": {
      const { rows, totals } = await occupancyReport();
      const columns: ReportColumn[] = [
        { key: "property", header: "Property" },
        { key: "units", header: "Units", format: "number", align: "right" },
        { key: "occupied", header: "Occupied", format: "number", align: "right" },
        { key: "vacant", header: "Vacant", format: "number", align: "right" },
        { key: "occupancy", header: "Occupancy", format: "percent", align: "right" },
      ];
      return (
        <ReportTable
          title="Occupancy"
          columns={columns}
          rows={rows.map((r) => ({ ...r, _href: `/properties/${r.id}` }))}
          totals={{ property: "", units: totals.units, occupied: totals.occupied, vacant: totals.vacant, occupancy: totals.occupancy }}
          exportFilename="occupancy"
          hrefKey="_href"
        />
      );
    }

    case "maintenance-cost": {
      const { rows, totals } = await maintenanceCostReport();
      const columns: ReportColumn[] = [
        { key: "property", header: "Property" },
        { key: "count", header: "Work Orders", format: "number", align: "right" },
        { key: "total", header: "Total Cost", format: "money", align: "right" },
        { key: "avg", header: "Avg / Order", format: "money", align: "right" },
      ];
      return (
        <ReportTable
          title="Maintenance Cost"
          columns={columns}
          rows={rows.map((r) => ({ ...r, _href: `/properties/${r.id}` }))}
          totals={{ property: "", count: totals.count, total: totals.total }}
          exportFilename="maintenance-cost"
          hrefKey="_href"
        />
      );
    }

    case "vendor-spend": {
      const { rows, totals } = await vendorSpendReport();
      const columns: ReportColumn[] = [
        { key: "vendor", header: "Vendor" },
        { key: "category", header: "Category", format: "badge" },
        { key: "jobs", header: "Jobs", format: "number", align: "right" },
        { key: "spend", header: "Total Spend", format: "money", align: "right" },
        { key: "avg", header: "Avg / Job", format: "money", align: "right" },
      ];
      return (
        <ReportTable
          title="Vendor Spend"
          columns={columns}
          rows={rows.map((r) => ({ ...r, _href: `/vendors/${r.id}` }))}
          totals={{ vendor: "", jobs: totals.jobs, spend: totals.spend }}
          exportFilename="vendor-spend"
          hrefKey="_href"
        />
      );
    }

    case "security-deposit": {
      const { rows, totals } = await securityDepositReport();
      const columns: ReportColumn[] = [
        { key: "property", header: "Property" },
        { key: "unit", header: "Unit" },
        { key: "tenant", header: "Tenant" },
        { key: "amount", header: "Amount", format: "money", align: "right" },
        { key: "deductions", header: "Deductions", format: "money", align: "right" },
        { key: "refund", header: "Refunded", format: "money", align: "right" },
        { key: "status", header: "Status", format: "badge" },
      ];
      return (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total on Record" value={formatCurrency(totals.amount)} accent="blue" />
            <StatCard label="Currently Held" value={formatCurrency(totals.held)} accent="purple" />
            <StatCard label="Refunded" value={formatCurrency(totals.refunded)} accent="green" />
          </div>
          <ReportTable
            title="Security Deposits"
            columns={columns}
            rows={rows as ReportRow[]}
            totals={{ property: "", amount: totals.amount, refund: totals.refunded }}
            exportFilename="security-deposit"
          />
        </div>
      );
    }

    case "property-performance": {
      const { rows, totals } = await propertyPerformanceReport();
      const columns: ReportColumn[] = [
        { key: "property", header: "Property" },
        { key: "income", header: "Income", format: "money", align: "right" },
        { key: "expenses", header: "Expenses", format: "money", align: "right" },
        { key: "noi", header: "NOI", format: "money", align: "right" },
        { key: "cashFlow", header: "Cash Flow", format: "money", align: "right" },
        { key: "capRate", header: "Cap Rate", format: "percent", align: "right" },
      ];
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Trailing 12 months, cash basis. Cap rate uses estimated property value.
          </p>
          <ReportTable
            title="Property Performance"
            columns={columns}
            rows={rows.map((r) => ({ ...r, _href: `/properties/${r.id}` }))}
            totals={{ property: "", income: totals.income, expenses: totals.expenses, noi: totals.noi, cashFlow: totals.cashFlow }}
            exportFilename="property-performance"
            hrefKey="_href"
          />
        </div>
      );
    }

    default:
      return (
        <EmptyState
          title="Coming soon"
          description="This report isn't available yet. Check back soon — the data model is in place."
        />
      );
  }
}

function PeriodNote({ period, slug }: { period: string; slug: string }) {
  const current = new Date().getFullYear();
  const years = [current, current - 1, current - 2].map(String);
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">Period:</span>
      {years.map((y) => (
        <a
          key={y}
          href={`/reports/${slug}?period=${y}`}
          className={
            y === period
              ? "rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
              : "rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent"
          }
        >
          {y}
        </a>
      ))}
    </div>
  );
}
