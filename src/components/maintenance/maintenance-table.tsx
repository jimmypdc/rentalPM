"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Money } from "@/components/shared/money";
import { label } from "@/lib/enums";

export interface MaintenanceRow {
  id: string;
  number: number;
  title: string;
  property: string;
  unit: string | null;
  tenant: string | null;
  category: string;
  priority: string;
  status: string;
  vendor: string | null;
  estimatedCost: number;
  actualCost: number;
  reportedDate: string;
  scheduledDate: string | null;
  ageDays: number;
}

export function MaintenanceTable({ data }: { data: MaintenanceRow[] }) {
  const columns: Column<MaintenanceRow>[] = [
    {
      key: "number",
      header: "#",
      sortable: true,
      sortValue: (r) => r.number,
      csv: (r) => r.number,
      className: "text-muted-foreground tabular-nums",
      cell: (r) => <span className="tabular-nums text-muted-foreground">#{r.number}</span>,
    },
    {
      key: "title",
      header: "Title",
      sortable: true,
      sortValue: (r) => r.title,
      csv: (r) => r.title,
      cell: (r) => (
        <Link href={`/maintenance/${r.id}`} className="font-medium text-foreground hover:text-primary">
          {r.title}
        </Link>
      ),
    },
    {
      key: "property",
      header: "Property/Unit",
      sortable: true,
      sortValue: (r) => r.property,
      csv: (r) => `${r.property}${r.unit ? ` / ${r.unit}` : ""}`,
      cell: (r) => (
        <div className="text-sm">
          <p>{r.property}</p>
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
      cell: (r) => <span className="text-sm">{label(r.category)}</span>,
    },
    {
      key: "priority",
      header: "Priority",
      sortable: true,
      sortValue: (r) => r.priority,
      csv: (r) => label(r.priority),
      cell: (r) => <StatusBadge value={r.priority} />,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortValue: (r) => r.status,
      csv: (r) => label(r.status),
      cell: (r) => <StatusBadge value={r.status} />,
    },
    {
      key: "vendor",
      header: "Vendor",
      hideable: true,
      csv: (r) => r.vendor ?? "",
      cell: (r) => <span className="text-sm text-muted-foreground">{r.vendor ?? "—"}</span>,
    },
    {
      key: "cost",
      header: "Cost",
      sortable: true,
      sortValue: (r) => r.actualCost || r.estimatedCost,
      csv: (r) => r.actualCost || r.estimatedCost,
      className: "text-right",
      headClassName: "text-right",
      cell: (r) => <Money value={r.actualCost || r.estimatedCost} muteZero className="font-medium" />,
    },
    {
      key: "age",
      header: "Age",
      sortable: true,
      sortValue: (r) => r.ageDays,
      csv: (r) => r.ageDays,
      className: "text-right",
      headClassName: "text-right",
      cell: (r) => <span className="tabular-nums text-sm text-muted-foreground">{r.ageDays}d</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchable={(r) => `${r.number} ${r.title} ${r.property} ${r.unit ?? ""} ${r.tenant ?? ""} ${r.category} ${r.vendor ?? ""}`}
      searchPlaceholder="Search requests…"
      getRowHref={(r) => `/maintenance/${r.id}`}
      exportFilename="maintenance"
      initialSort={{ key: "number", dir: "desc" }}
      emptyTitle="No maintenance requests"
      emptyDescription="Create your first work order to start tracking repairs."
    />
  );
}
