"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Money } from "@/components/shared/money";
import { label } from "@/lib/enums";

export interface PropertyRow {
  id: string;
  name: string;
  type: string;
  status: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  estimatedValue: number;
  unitCount: number;
  occupiedCount: number;
  monthlyRent: number;
}

export function PropertiesTable({ data }: { data: PropertyRow[] }) {
  const columns: Column<PropertyRow>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      sortValue: (r) => r.name,
      csv: (r) => r.name,
      cell: (r) => (
        <div>
          <Link href={`/properties/${r.id}`} className="font-medium text-foreground hover:text-primary">
            {r.name}
          </Link>
          <p className="text-xs text-muted-foreground">{r.street}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      sortValue: (r) => r.type,
      csv: (r) => label(r.type),
      cell: (r) => <span className="text-sm">{label(r.type)}</span>,
    },
    {
      key: "address",
      header: "Address",
      hideable: true,
      csv: (r) => `${r.city}, ${r.state}`,
      cell: (r) => (
        <span className="text-sm text-muted-foreground">
          {r.city}, {r.state}
        </span>
      ),
    },
    {
      key: "units",
      header: "Units",
      sortable: true,
      sortValue: (r) => r.unitCount,
      csv: (r) => `${r.occupiedCount}/${r.unitCount}`,
      cell: (r) => (
        <span className="tabular-nums text-sm">
          {r.occupiedCount}/{r.unitCount}
        </span>
      ),
    },
    {
      key: "monthlyRent",
      header: "Monthly Rent",
      sortable: true,
      sortValue: (r) => r.monthlyRent,
      csv: (r) => r.monthlyRent,
      className: "text-right",
      headClassName: "text-right",
      cell: (r) => <Money value={r.monthlyRent} className="font-medium" />,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortValue: (r) => r.status,
      csv: (r) => label(r.status),
      cell: (r) => <StatusBadge value={r.status} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchable={(r) => `${r.name} ${r.street} ${r.city} ${r.state} ${r.zip} ${r.type}`}
      searchPlaceholder="Search properties…"
      getRowHref={(r) => `/properties/${r.id}`}
      exportFilename="properties"
      emptyTitle="No properties yet"
      emptyDescription="Add your first property to start tracking units, leases, and finances."
    />
  );
}
