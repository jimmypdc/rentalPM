"use client";

import { DataTable, type Column } from "@/components/shared/data-table";
import { Money } from "@/components/shared/money";
import { Badge } from "@/components/ui/badge";
import { label } from "@/lib/enums";
import { formatDate } from "@/lib/utils";

export interface PaymentRow {
  id: string;
  tenant: string;
  amount: number;
  receivedOn: string;
  method: string;
  reference: string | null;
  allocatedTo: string;
  voided: boolean;
}

export function PaymentsTable({ data }: { data: PaymentRow[] }) {
  const columns: Column<PaymentRow>[] = [
    {
      key: "receivedOn",
      header: "Date",
      sortable: true,
      sortValue: (r) => r.receivedOn,
      csv: (r) => formatDate(r.receivedOn, "short"),
      cell: (r) => <span className="text-sm">{formatDate(r.receivedOn, "short")}</span>,
    },
    {
      key: "tenant",
      header: "Tenant",
      sortable: true,
      sortValue: (r) => r.tenant,
      csv: (r) => r.tenant,
      cell: (r) => (
        <span className="text-sm font-medium">
          {r.tenant}
          {r.voided && (
            <Badge tone="slate" className="ml-2 align-middle">
              Voided
            </Badge>
          )}
        </span>
      ),
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
          className={r.voided ? "text-muted-foreground line-through" : "font-medium text-success"}
        />
      ),
    },
    {
      key: "method",
      header: "Method",
      sortable: true,
      sortValue: (r) => r.method,
      csv: (r) => label(r.method),
      cell: (r) => <span className="text-sm">{label(r.method)}</span>,
    },
    {
      key: "reference",
      header: "Reference",
      hideable: true,
      csv: (r) => r.reference ?? "",
      cell: (r) => <span className="text-sm text-muted-foreground">{r.reference ?? "—"}</span>,
    },
    {
      key: "allocatedTo",
      header: "Applied To",
      csv: (r) => r.allocatedTo,
      cell: (r) => <span className="text-sm text-muted-foreground">{r.allocatedTo}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchable={(r) => `${r.tenant} ${r.method} ${r.reference ?? ""} ${r.allocatedTo}`}
      searchPlaceholder="Search payments…"
      exportFilename="payments"
      initialSort={{ key: "receivedOn", dir: "desc" }}
      emptyTitle="No payments yet"
      emptyDescription="Record your first payment to start tracking collections."
    />
  );
}
