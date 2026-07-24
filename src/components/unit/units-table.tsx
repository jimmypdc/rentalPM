"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Money } from "@/components/shared/money";

export interface UnitRow {
  id: string;
  number: string;
  propertyId: string;
  propertyName: string;
  status: string;
  bedrooms: number | null;
  bathrooms: number;
  squareFeet: number | null;
  marketRent: number;
  currentRent: number;
  depositAmount: number;
  tenantName: string | null;
}

export function UnitsTable({ data }: { data: UnitRow[] }) {
  const columns: Column<UnitRow>[] = [
    {
      key: "propertyName",
      header: "Property",
      sortable: true,
      sortValue: (r) => r.propertyName,
      csv: (r) => r.propertyName,
      cell: (r) => (
        <Link href={`/properties/${r.propertyId}`} className="font-medium text-foreground hover:text-primary">
          {r.propertyName}
        </Link>
      ),
    },
    {
      key: "number",
      header: "Unit #",
      sortable: true,
      sortValue: (r) => r.number,
      csv: (r) => r.number,
      cell: (r) => <span className="text-sm">{r.number}</span>,
    },
    {
      key: "bedsBaths",
      header: "Beds/Baths",
      hideable: true,
      csv: (r) => `${r.bedrooms ?? "—"} / ${r.bathrooms || "—"}`,
      cell: (r) => (
        <span className="tabular-nums text-sm">
          {r.bedrooms ?? "—"} bd / {r.bathrooms || "—"} ba
        </span>
      ),
    },
    {
      key: "squareFeet",
      header: "Sqft",
      hideable: true,
      sortable: true,
      sortValue: (r) => r.squareFeet ?? 0,
      csv: (r) => r.squareFeet ?? "",
      cell: (r) => (
        <span className="tabular-nums text-sm">
          {r.squareFeet ? r.squareFeet.toLocaleString() : "—"}
        </span>
      ),
    },
    {
      key: "marketRent",
      header: "Market Rent",
      sortable: true,
      sortValue: (r) => r.marketRent,
      csv: (r) => r.marketRent,
      className: "text-right",
      headClassName: "text-right",
      cell: (r) => <Money value={r.marketRent} className="font-medium" />,
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
      key: "tenant",
      header: "Tenant",
      hideable: true,
      csv: (r) => r.tenantName ?? "",
      cell: (r) =>
        r.tenantName ? (
          <span className="text-sm">{r.tenantName}</span>
        ) : (
          <span className="text-sm text-muted-foreground">Vacant</span>
        ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchable={(r) => `${r.propertyName} ${r.number} ${r.tenantName ?? ""} ${r.status}`}
      searchPlaceholder="Search units…"
      getRowHref={(r) => `/units/${r.id}/edit`}
      exportFilename="units"
      emptyTitle="No units yet"
      emptyDescription="Add units to your properties to track occupancy and rent."
    />
  );
}
