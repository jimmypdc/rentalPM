"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Money } from "@/components/shared/money";
import { Badge } from "@/components/ui/badge";

export interface OwnerRow {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  isSelf: boolean;
  email: string | null;
  phone: string | null;
  propertyCount: number;
  unitCount: number;
  monthlyRent: number;
  managementFeePercent: number;
}

export function OwnersTable({ data }: { data: OwnerRow[] }) {
  const columns: Column<OwnerRow>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      sortValue: (r) => `${r.lastName} ${r.firstName}`,
      csv: (r) => `${r.firstName} ${r.lastName}`,
      cell: (r) => (
        <div className="flex items-center gap-2">
          <Link href={`/owners/${r.id}`} className="font-medium text-foreground hover:text-primary">
            {r.firstName} {r.lastName}
          </Link>
          {r.isSelf && <Badge tone="blue">You</Badge>}
        </div>
      ),
    },
    {
      key: "company",
      header: "Company",
      sortable: true,
      hideable: true,
      sortValue: (r) => r.company ?? "",
      csv: (r) => r.company ?? "",
      cell: (r) => <span className="text-sm">{r.company ?? "—"}</span>,
    },
    {
      key: "contact",
      header: "Contact",
      hideable: true,
      csv: (r) => r.phone ?? r.email ?? "",
      cell: (r) => (
        <div className="text-sm">
          <p>{r.phone ?? "—"}</p>
          {r.email && <p className="text-xs text-muted-foreground">{r.email}</p>}
        </div>
      ),
    },
    {
      key: "properties",
      header: "Properties",
      sortable: true,
      sortValue: (r) => r.propertyCount,
      csv: (r) => r.propertyCount,
      cell: (r) => <span className="tabular-nums">{r.propertyCount}</span>,
    },
    {
      key: "units",
      header: "Units",
      sortable: true,
      hideable: true,
      sortValue: (r) => r.unitCount,
      csv: (r) => r.unitCount,
      cell: (r) => <span className="tabular-nums">{r.unitCount}</span>,
    },
    {
      key: "monthlyRent",
      header: "Monthly Income",
      sortable: true,
      sortValue: (r) => r.monthlyRent,
      csv: (r) => r.monthlyRent,
      className: "text-right",
      headClassName: "text-right",
      cell: (r) => <Money value={r.monthlyRent} className="font-medium" />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchable={(r) => `${r.firstName} ${r.lastName} ${r.company ?? ""} ${r.email ?? ""} ${r.phone ?? ""}`}
      searchPlaceholder="Search owners…"
      getRowHref={(r) => `/owners/${r.id}`}
      exportFilename="owners"
      emptyTitle="No owners yet"
      emptyDescription="Add your first owner to start tracking properties and distributions."
    />
  );
}
