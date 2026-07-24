"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Check, MoreHorizontal, Pencil, Ban } from "lucide-react";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Money } from "@/components/shared/money";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { label } from "@/lib/enums";
import { formatDate, cn } from "@/lib/utils";
import { voidExpense } from "@/server/expenses";

export interface ExpenseRow {
  id: string;
  date: string;
  property: string;
  unit: string | null;
  vendor: string | null;
  category: string;
  description: string | null;
  amount: number;
  method: string;
  taxDeductible: boolean;
  isRecurring: boolean;
  voided: boolean;
}

export function ExpensesTable({ data }: { data: ExpenseRow[] }) {
  const router = useRouter();
  const [target, setTarget] = React.useState<ExpenseRow | null>(null);
  const [pending, setPending] = React.useState(false);

  async function onVoid() {
    if (!target) return;
    setPending(true);
    const result = await voidExpense(target.id);
    if (result.ok) {
      toast.success("Expense voided");
      setTarget(null);
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setPending(false);
  }

  const columns: Column<ExpenseRow>[] = [
    {
      key: "date",
      header: "Date",
      sortable: true,
      sortValue: (r) => r.date,
      csv: (r) => formatDate(r.date),
      cell: (r) => (
        <span className={cn("text-sm tabular-nums", r.voided && "text-muted-foreground line-through")}>
          {formatDate(r.date, "short")}
        </span>
      ),
    },
    {
      key: "property",
      header: "Property",
      sortable: true,
      sortValue: (r) => r.property,
      csv: (r) => `${r.property}${r.unit ? ` / ${r.unit}` : ""}`,
      cell: (r) => (
        <div className={cn(r.voided && "text-muted-foreground line-through")}>
          <p className="text-sm font-medium text-foreground">{r.property}</p>
          {r.unit && <p className="text-xs text-muted-foreground">Unit {r.unit}</p>}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      sortValue: (r) => r.category,
      csv: (r) => label(r.category),
      cell: (r) => (
        <div className="flex items-center gap-1.5">
          <StatusBadge value={r.category} />
          {r.isRecurring && <span className="text-xs text-muted-foreground">↻</span>}
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      hideable: true,
      csv: (r) => r.description ?? "",
      cell: (r) => (
        <span className={cn("text-sm", r.voided ? "text-muted-foreground line-through" : "text-muted-foreground")}>
          {r.description ?? "—"}
        </span>
      ),
    },
    {
      key: "vendor",
      header: "Vendor",
      hideable: true,
      sortable: true,
      sortValue: (r) => r.vendor ?? "",
      csv: (r) => r.vendor ?? "",
      cell: (r) => <span className="text-sm">{r.vendor ?? "—"}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      sortValue: (r) => r.amount,
      csv: (r) => r.amount,
      className: "text-right",
      headClassName: "text-right",
      cell: (r) => (
        <Money
          value={r.amount}
          cents
          className={cn(
            "font-medium",
            r.voided ? "text-muted-foreground line-through" : "text-destructive",
          )}
        />
      ),
    },
    {
      key: "deductible",
      header: "Deductible",
      hideable: true,
      className: "text-center",
      headClassName: "text-center",
      csv: (r) => (r.taxDeductible ? "Yes" : "No"),
      cell: (r) =>
        r.taxDeductible ? (
          <Check className="mx-auto h-4 w-4 text-success" />
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "w-10",
      cell: (r) => (
        <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/expenses/${r.id}/edit`}>
                  <Pencil className="h-4 w-4" /> Edit
                </Link>
              </DropdownMenuItem>
              {!r.voided && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={(e) => {
                      e.preventDefault();
                      setTarget(r);
                    }}
                  >
                    <Ban className="h-4 w-4" /> Void
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        searchable={(r) =>
          `${r.property} ${r.unit ?? ""} ${r.category} ${r.description ?? ""} ${r.vendor ?? ""}`
        }
        searchPlaceholder="Search expenses…"
        exportFilename="expenses"
        initialSort={{ key: "date", dir: "desc" }}
        emptyTitle="No expenses yet"
        emptyDescription="Log your first expense to start tracking operating costs and deductions."
      />
      <ConfirmDialog
        open={!!target}
        onOpenChange={(v) => !v && setTarget(null)}
        title="Void this expense?"
        description="Voided expenses are kept for the record but excluded from accounting totals. This cannot be undone."
        confirmLabel="Void expense"
        destructive
        loading={pending}
        onConfirm={onVoid}
      />
    </>
  );
}
