"use client";

import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Money } from "@/components/shared/money";
import { formatDate } from "@/lib/utils";

export interface DepositRow {
  id: string;
  tenant: string;
  property: string;
  unit: string;
  amount: number;
  receivedOn: string | null;
  status: string;
  refundAmount: number;
  account: string | null;
}

export function DepositsTable({ data }: { data: DepositRow[] }) {
  const columns: Column<DepositRow>[] = [
    {
      key: "tenant",
      header: "Tenant",
      sortable: true,
      sortValue: (r) => r.tenant,
      csv: (r) => r.tenant,
      cell: (r) => <span className="text-sm font-medium">{r.tenant}</span>,
    },
    {
      key: "property",
      header: "Property / Unit",
      sortable: true,
      sortValue: (r) => `${r.property} ${r.unit}`,
      csv: (r) => `${r.property} · ${r.unit}`,
      cell: (r) => (
        <div>
          <span className="text-sm">{r.property}</span>
          <span className="block text-xs text-muted-foreground">Unit {r.unit}</span>
        </div>
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
      cell: (r) => <Money value={r.amount} className="font-medium" />,
    },
    {
      key: "receivedOn",
      header: "Received",
      sortable: true,
      sortValue: (r) => r.receivedOn ?? "",
      csv: (r) => (r.receivedOn ? formatDate(r.receivedOn, "short") : ""),
      cell: (r) => (
        <span className="text-sm text-muted-foreground">
          {r.receivedOn ? formatDate(r.receivedOn, "short") : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortValue: (r) => r.status,
      csv: (r) => r.status,
      cell: (r) => <StatusBadge value={r.status} />,
    },
    {
      key: "refundAmount",
      header: "Refund",
      sortable: true,
      sortValue: (r) => r.refundAmount,
      csv: (r) => r.refundAmount,
      className: "text-right",
      headClassName: "text-right",
      cell: (r) => <Money value={r.refundAmount} muteZero />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchable={(r) => `${r.tenant} ${r.property} ${r.unit} ${r.account ?? ""}`}
      searchPlaceholder="Search deposits…"
      exportFilename="deposits"
      emptyTitle="No deposits yet"
      emptyDescription="Record a security deposit to start tracking held funds."
    />
  );
}
