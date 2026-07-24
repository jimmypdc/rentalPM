import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { num } from "@/lib/utils";
import { getExpenseFormData } from "@/server/expenses";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { ExpenseForm } from "@/components/expense/expense-form";

export const metadata: Metadata = { title: "Edit Expense" };
export const dynamic = "force-dynamic";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [expense, formData] = await Promise.all([
    prisma.expense.findUnique({ where: { id } }),
    getExpenseFormData(),
  ]);
  if (!expense) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href="/expenses" label="Expenses" />
      <PageHeader title="Edit Expense" description={expense.description ?? "Update expense details."} />
      <ExpenseForm
        {...formData}
        initial={{
          id: expense.id,
          date: expense.date.toISOString().slice(0, 10),
          propertyId: expense.propertyId,
          unitId: expense.unitId ?? "",
          vendorId: expense.vendorId ?? "",
          category: expense.category,
          description: expense.description ?? "",
          amount: String(num(expense.amount)),
          method: expense.method,
          taxDeductible: expense.taxDeductible,
          isRecurring: expense.isRecurring,
          notes: expense.notes ?? "",
        }}
      />
    </div>
  );
}
