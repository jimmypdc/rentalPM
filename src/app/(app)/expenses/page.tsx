import Link from "next/link";
import type { Metadata } from "next";
import { Plus, TrendingDown, CalendarRange, Receipt } from "lucide-react";
import { listExpenses } from "@/server/expenses";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { ExpensesTable } from "@/components/expense/expenses-table";
import { formatCurrency } from "@/lib/utils";
import { startOfMonth } from "@/lib/dates";

export const metadata: Metadata = { title: "Expenses" };
export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const expenses = await listExpenses();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  let monthTotal = 0;
  let ytdTotal = 0;
  let deductibleTotal = 0;
  for (const e of expenses) {
    if (e.voided) continue;
    const d = new Date(e.date);
    if (d >= monthStart) monthTotal += e.amount;
    if (d >= yearStart) {
      ytdTotal += e.amount;
      if (e.taxDeductible) deductibleTotal += e.amount;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Operating costs, repairs, and capital spending across your portfolio."
        actions={
          <Button asChild>
            <Link href="/expenses/new">
              <Plus className="h-4 w-4" /> Add Expense
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="This Month"
          value={formatCurrency(monthTotal)}
          icon={TrendingDown}
          accent="amber"
        />
        <StatCard
          label="Year to Date"
          value={formatCurrency(ytdTotal)}
          icon={CalendarRange}
          accent="blue"
        />
        <StatCard
          label="Tax Deductible (YTD)"
          value={formatCurrency(deductibleTotal)}
          icon={Receipt}
          accent="green"
        />
      </div>

      <ExpensesTable data={expenses} />
    </div>
  );
}
