"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Money } from "@/components/shared/money";
import { formatDate } from "@/lib/utils";

export interface LeaseRow {
  id: string;
  property: string;
  unit: string;
  tenant: string;
  tenantNames: string;
  startDate: string;
  endDate: string;
  rent: number;
  status: string;
  daysUntilEnd: number | null;
  balance: number;
}

function expiresLabel(days: number | null): { text: string; className: string } {
  if (days === null) return { text: "—", className: "text-muted-foreground" };
  if (days < 0) return { text: `Expired ${Math.abs(days)}d ago`, className: "text-destructive font-medium" };
  if (days <= 30) return { text: `${days}d`, className: "text-destructive font-medium" };
  if (days <= 90) return { text: `${days}d`, className: "text-amber-600 font-medium" };
  return { text: `${days}d`, className: "text-muted-foreground" };
}

export function LeasesTable({ data }: { data: LeaseRow[] }) {
  const columns: Column<LeaseRow>[] = [
    {
      key: "unit",
      header: "Property / Unit",
      sortable: true,
      sortValue: (r) => `${r.property} ${r.unit}`,
      csv: (r) => `${r.property} · ${r.unit}`,
      cell: (r) => (
        <div>
          <Link href={`/leases/${r.id}`} className="font-medium text-foreground hover:text-primary">
            {r.property}
          </Link>
          <p className="text-xs text-muted-foreground">Unit {r.unit}</p>
        </div>
      ),
    },
    {
      key: "tenant",
      header: "Tenant",
      sortable: true,
      sortValue: (r) => r.tenant,
      csv: (r) => r.tenantNames,
      cell: (r) => <span className="text-sm">{r.tenant}</span>,
    },
    {
      key: "term",
      header: "Term",
      sortable: true,
      sortValue: (r) => r.startDate,
      csv: (r) => `${formatDate(r.startDate, "short")} – ${formatDate(r.endDate, "short")}`,
      cell: (r) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(r.startDate, "short")} – {formatDate(r.endDate, "short")}
        </span>
      ),
    },
    {
      key: "rent",
      header: "Rent",
      sortable: true,
      sortValue: (r) => r.rent,
      csv: (r) => r.rent,
      className: "text-right",
      headClassName: "text-right",
      cell: (r) => <Money value={r.rent} className="font-medium" />,
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
      key: "balance",
      header: "Balance",
      sortable: true,
      sortValue: (r) => r.balance,
      csv: (r) => r.balance,
      className: "text-right",
      headClassName: "text-right",
      cell: (r) => (
        <Money value={r.balance} className={r.balance > 0 ? "font-medium text-destructive" : "text-muted-foreground"} />
      ),
    },
    {
      key: "expires",
      header: "Expires",
      sortable: true,
      sortValue: (r) => r.daysUntilEnd ?? Number.MAX_SAFE_INTEGER,
      csv: (r) => (r.daysUntilEnd === null ? "" : r.daysUntilEnd),
      cell: (r) => {
        const e = expiresLabel(r.daysUntilEnd);
        return <span className={`text-sm ${e.className}`}>{e.text}</span>;
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchable={(r) => `${r.property} ${r.unit} ${r.tenantNames} ${r.status}`}
      searchPlaceholder="Search leases…"
      getRowHref={(r) => `/leases/${r.id}`}
      exportFilename="leases"
      initialSort={{ key: "term", dir: "desc" }}
      emptyTitle="No leases yet"
      emptyDescription="Create your first lease to start tracking rent and terms."
    />
  );
}
