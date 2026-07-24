"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Landmark,
  Wallet,
  Hammer,
  Banknote,
  PiggyBank,
  Receipt,
} from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { MetricTooltip } from "@/components/shared/metric-tooltip";
import { Money } from "@/components/shared/money";
import { PerformanceChart, MiniBarChart } from "@/components/shared/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { label } from "@/lib/enums";
import { formatCurrency } from "@/lib/utils";
import { METRIC_FORMULAS } from "@/lib/metrics";
import type { AccountingData } from "@/server/accounting";
import type { SelectOption } from "@/types";

const ALL = "ALL";
const TTM = "TTM";

export interface AccountingFilterOptions {
  properties: SelectOption[];
  years: number[];
}

export interface AccountingSelected {
  propertyId?: string;
  year?: number;
}

export function AccountingView({
  data,
  filters,
  selected,
}: {
  data: AccountingData;
  filters: AccountingFilterOptions;
  selected: AccountingSelected;
}) {
  const router = useRouter();
  const { summary } = data;

  function pushFilters(next: AccountingSelected) {
    const params = new URLSearchParams();
    if (next.propertyId) params.set("propertyId", next.propertyId);
    if (next.year) params.set("year", String(next.year));
    const qs = params.toString();
    router.push(qs ? `/accounting?${qs}` : "/accounting");
  }

  const categoryData = data.expensesByCategory.map((c) => ({
    label: label(c.category),
    value: c.amount,
  }));

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{data.period.label}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={selected.propertyId ?? ALL}
            onValueChange={(v) =>
              pushFilters({ propertyId: v === ALL ? undefined : v, year: selected.year })
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All properties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All properties</SelectItem>
              {filters.properties.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selected.year ? String(selected.year) : TTM}
            onValueChange={(v) =>
              pushFilters({
                propertyId: selected.propertyId,
                year: v === TTM ? undefined : Number(v),
              })
            }
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Trailing 12 months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TTM}>Trailing 12 months</SelectItem>
              {filters.years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Rental Income"
          value={formatCurrency(summary.rentalIncome)}
          icon={TrendingUp}
          accent="green"
        />
        <StatCard
          label="Operating Expenses"
          value={formatCurrency(summary.operatingExpenses)}
          icon={TrendingDown}
          accent="amber"
        />
        <StatCard
          label="NOI"
          value={formatCurrency(summary.noi)}
          icon={Landmark}
          accent="blue"
          hint="Net operating income"
        />
        <StatCard
          label="Debt Service"
          value={formatCurrency(summary.debtService)}
          icon={Banknote}
          accent="slate"
        />
        <StatCard
          label="Cash Flow"
          value={formatCurrency(summary.cashFlow)}
          icon={Wallet}
          accent={summary.cashFlow >= 0 ? "green" : "red"}
          hint="NOI − debt service"
        />
        <StatCard
          label="CapEx"
          value={formatCurrency(summary.capEx)}
          icon={Hammer}
          accent="purple"
        />
        <StatCard
          label="Owner Distributions"
          value={formatCurrency(summary.ownerDistributions)}
          icon={PiggyBank}
          accent="slate"
        />
        <StatCard
          label="Deposits Held"
          value={formatCurrency(summary.securityDeposits)}
          icon={Receipt}
          accent="blue"
        />
      </div>

      {/* Performance chart */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-1.5">
            Income vs. Expenses
            <MetricTooltip formula={METRIC_FORMULAS.noi} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PerformanceChart data={data.series} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Expenses by category */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length ? (
              <MiniBarChart data={categoryData} color="#f59e0b" />
            ) : (
              <EmptyState title="No expenses" description="No expenses recorded for this period." />
            )}
          </CardContent>
        </Card>

        {/* Category breakdown table */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {data.expensesByCategory.length ? (
              <div className="divide-y divide-border">
                {data.expensesByCategory.map((c) => (
                  <div key={c.category} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-muted-foreground">{label(c.category)}</span>
                    <Money value={c.amount} className="font-medium tabular-nums" />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No expenses" description="Nothing to break down yet." />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-property P&L */}
      <Card>
        <CardHeader>
          <CardTitle>Property Profit &amp; Loss</CardTitle>
        </CardHeader>
        <CardContent>
          {data.propertyPnl.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Property</th>
                    <th className="py-2 px-4 text-right font-medium">Income</th>
                    <th className="py-2 px-4 text-right font-medium">Op. Expenses</th>
                    <th className="py-2 px-4 text-right font-medium">NOI</th>
                    <th className="py-2 pl-4 text-right font-medium">Cash Flow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.propertyPnl.map((row) => (
                    <tr key={row.property}>
                      <td className="py-2.5 pr-4 font-medium text-foreground">{row.property}</td>
                      <td className="py-2.5 px-4 text-right">
                        <Money value={row.income} />
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <Money value={row.expenses} />
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <Money value={row.noi} />
                      </td>
                      <td className="py-2.5 pl-4 text-right">
                        <Money value={row.cashFlow} signed />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No properties" description="Add a property to see its P&L." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
