"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Money } from "@/components/shared/money";
import { formatDate } from "@/lib/utils";
import type { RentRollRow } from "@/server/rentRoll";

export function RentRollTable({ data }: { data: RentRollRow[] }) {
  const columns: Column<RentRollRow>[] = [
    {
      key: "property",
      header: "Property / Unit",
      sortable: true,
      sortValue: (r) => `${r.property} ${r.unit}`,
      csv: (r) => `${r.property} · ${r.unit}`,
      cell: (r) =>
        r.leaseId ? (
          <Link href={`/leases/${r.leaseId}`} className="hover:text-primary">
            <span className="font-medium text-foreground">{r.property}</span>
            <span className="block text-xs text-muted-foreground">Unit {r.unit}</span>
          </Link>
        ) : (
          <div>
            <span className="font-medium text-foreground">{r.property}</span>
            <span className="block text-xs text-muted-foreground">Unit {r.unit}</span>
          </div>
        ),
    },
    {
      key: "tenant",
      header: "Tenant",
      sortable: true,
      sortValue: (r) => r.tenant,
      csv: (r) => r.tenant,
      cell: (r) => <span className="text-sm">{r.tenant}</span>,
    },
    {
      key: "term",
      header: "Term",
      sortable: true,
      sortValue: (r) => r.leaseStart ?? "",
      csv: (r) =>
        r.leaseStart ? `${formatDate(r.leaseStart, "short")} – ${formatDate(r.leaseEnd, "short")}` : "",
      cell: (r) =>
        r.leaseStart ? (
          <span className="text-sm text-muted-foreground">
            {formatDate(r.leaseStart, "short")} – {formatDate(r.leaseEnd, "short")}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "monthlyRent",
      header: "Rent",
      sortable: true,
      sortValue: (r) => r.monthlyRent,
      csv: (r) => r.monthlyRent,
      className: "text-right",
      headClassName: "text-right",
      cell: (r) => <Money value={r.monthlyRent} />,
    },
    {
      key: "otherMonthlyCharges",
      header: "Other",
      hideable: true,
      sortable: true,
      sortValue: (r) => r.otherMonthlyCharges,
      csv: (r) => r.otherMonthlyCharges,
      className: "text-right",
      headClassName: "text-right",
      cell: (r) => <Money value={r.otherMonthlyCharges} muteZero />,
    },
    {
      key: "totalMonthlyCharges",
      header: "Total Monthly",
      sortable: true,
      sortValue: (r) => r.totalMonthlyCharges,
      csv: (r) => r.totalMonthlyCharges,
      className: "text-right",
      headClassName: "text-right",
      cell: (r) => <Money value={r.totalMonthlyCharges} className="font-medium" />,
    },
    {
      key: "amountPaidThisMonth",
      header: "Paid (MTD)",
      sortable: true,
      sortValue: (r) => r.amountPaidThisMonth,
      csv: (r) => r.amountPaidThisMonth,
      className: "text-right",
      headClassName: "text-right",
      cell: (r) => <Money value={r.amountPaidThisMonth} muteZero className="text-success" />,
    },
    {
      key: "outstandingBalance",
      header: "Balance",
      sortable: true,
      sortValue: (r) => r.outstandingBalance,
      csv: (r) => r.outstandingBalance,
      className: "text-right",
      headClassName: "text-right",
      cell: (r) => (
        <Money
          value={r.outstandingBalance}
          className={r.outstandingBalance > 0 ? "font-medium text-destructive" : "text-muted-foreground"}
        />
      ),
    },
    {
      key: "occupancyStatus",
      header: "Occupancy",
      sortable: true,
      sortValue: (r) => r.occupancyStatus,
      csv: (r) => r.occupancyStatus,
      cell: (r) => <StatusBadge value={r.occupancyStatus} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchable={(r) => `${r.property} ${r.unit} ${r.tenant}`}
      searchPlaceholder="Search by property, unit, or tenant…"
      exportFilename="rent-roll"
      initialSort={{ key: "property", dir: "asc" }}
      pageSize={20}
      emptyTitle="No units"
      emptyDescription="Add properties and units to build your rent roll."
    />
  );
}
