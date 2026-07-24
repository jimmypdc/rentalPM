import type { Metadata } from "next";
import { getExpenseFormData } from "@/server/expenses";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { ExpenseForm } from "@/components/expense/expense-form";

export const metadata: Metadata = { title: "Add Expense" };
export const dynamic = "force-dynamic";

export default async function NewExpensePage() {
  const formData = await getExpenseFormData();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href="/expenses" label="Expenses" />
      <PageHeader title="Add Expense" description="Log an operating or capital expense." />
      <ExpenseForm {...formData} />
    </div>
  );
}
