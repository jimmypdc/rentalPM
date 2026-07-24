"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Money } from "@/components/shared/money";

export interface TenantRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: string;
  currentProperty: string | null;
  currentUnit: string | null;
  rent: number;
  balance: number;
  moveInDate: string | null;
}

export function TenantsTable({ data }: { data: TenantRow[] }) {
  const columns: Column<TenantRow>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      sortValue: (r) => `${r.lastName} ${r.firstName}`,
      csv: (r) => `${r.firstName} ${r.lastName}`,
      cell: (r) => (
        <div>
          <Link href={`/tenants/${r.id}`} className="font-medium text-foreground hover:text-primary">
            {r.firstName} {r.lastName}
          </Link>
          {r.email && <p className="text-xs text-muted-foreground">{r.email}</p>}
        </div>
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
      key: "unit",
      header: "Property / Unit",
      hideable: true,
      csv: (r) => [r.currentProperty, r.currentUnit].filter(Boolean).join(" · "),
      cell: (r) =>
        r.currentProperty ? (
          <div className="text-sm">
            <p>{r.currentProperty}</p>
            {r.currentUnit && <p className="text-xs text-muted-foreground">Unit {r.currentUnit}</p>}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
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
      cell: (r) => (r.rent > 0 ? <Money value={r.rent} /> : <span className="text-muted-foreground">—</span>),
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
      key: "phone",
      header: "Phone",
      hideable: true,
      csv: (r) => r.phone ?? "",
      cell: (r) => <span className="text-sm">{r.phone ?? "—"}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchable={(r) => `${r.firstName} ${r.lastName} ${r.email ?? ""} ${r.phone ?? ""} ${r.currentProperty ?? ""}`}
      searchPlaceholder="Search tenants…"
      getRowHref={(r) => `/tenants/${r.id}`}
      exportFilename="tenants"
      emptyTitle="No tenants yet"
      emptyDescription="Add your first tenant to start tracking leases, rent, and balances."
    />
  );
}
