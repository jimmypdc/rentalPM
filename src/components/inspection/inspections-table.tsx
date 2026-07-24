"use client";

import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { label } from "@/lib/enums";
import { formatDate } from "@/lib/utils";

export interface InspectionRow {
  id: string;
  property: string;
  unit: string | null;
  type: string;
  inspectionDate: string;
  inspector: string | null;
  conditionRating: string;
  followUpRequired: boolean;
  itemCount: number;
  nextInspectionDate: string | null;
}

export function InspectionsTable({ data }: { data: InspectionRow[] }) {
  const columns: Column<InspectionRow>[] = [
    {
      key: "property",
      header: "Property/Unit",
      sortable: true,
      sortValue: (r) => r.property,
      csv: (r) => `${r.property}${r.unit ? ` / ${r.unit}` : ""}`,
      cell: (r) => (
        <div className="text-sm">
          <p className="font-medium text-foreground">{r.property}</p>
          {r.unit && <p className="text-xs text-muted-foreground">Unit {r.unit}</p>}
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
      key: "date",
      header: "Date",
      sortable: true,
      sortValue: (r) => r.inspectionDate,
      csv: (r) => formatDate(r.inspectionDate),
      cell: (r) => <span className="text-sm">{formatDate(r.inspectionDate, "short")}</span>,
    },
    {
      key: "inspector",
      header: "Inspector",
      hideable: true,
      csv: (r) => r.inspector ?? "",
      cell: (r) => <span className="text-sm text-muted-foreground">{r.inspector ?? "—"}</span>,
    },
    {
      key: "condition",
      header: "Condition",
      sortable: true,
      sortValue: (r) => r.conditionRating,
      csv: (r) => label(r.conditionRating),
      cell: (r) => <StatusBadge value={r.conditionRating} />,
    },
    {
      key: "items",
      header: "Items",
      sortable: true,
      sortValue: (r) => r.itemCount,
      csv: (r) => r.itemCount,
      className: "text-right",
      headClassName: "text-right",
      cell: (r) => <span className="tabular-nums text-sm text-muted-foreground">{r.itemCount}</span>,
    },
    {
      key: "followup",
      header: "Follow-up",
      sortable: true,
      sortValue: (r) => (r.followUpRequired ? 1 : 0),
      csv: (r) => (r.followUpRequired ? "Yes" : "No"),
      cell: (r) =>
        r.followUpRequired ? (
          <Badge tone="amber">Required</Badge>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: "next",
      header: "Next",
      hideable: true,
      sortable: true,
      sortValue: (r) => r.nextInspectionDate ?? "",
      csv: (r) => (r.nextInspectionDate ? formatDate(r.nextInspectionDate) : ""),
      cell: (r) => (
        <span className="text-sm text-muted-foreground">
          {r.nextInspectionDate ? formatDate(r.nextInspectionDate, "short") : "—"}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchable={(r) => `${r.property} ${r.unit ?? ""} ${r.type} ${r.inspector ?? ""} ${r.conditionRating}`}
      searchPlaceholder="Search inspections…"
      getRowHref={(r) => `/inspections/${r.id}`}
      exportFilename="inspections"
      initialSort={{ key: "date", dir: "desc" }}
      emptyTitle="No inspections yet"
      emptyDescription="Record a move-in, move-out, or routine inspection to get started."
    />
  );
}
