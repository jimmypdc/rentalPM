"use client";

import * as React from "react";
import { Printer } from "lucide-react";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency, formatNumber, formatPercent, formatDate } from "@/lib/utils";

export type ReportFormat = "text" | "money" | "number" | "percent" | "date" | "badge";

export interface ReportColumn {
  key: string;
  header: string;
  format?: ReportFormat;
  align?: "right";
}

export type ReportRow = Record<string, string | number | null | undefined>;

function fmt(value: string | number | null | undefined, format?: ReportFormat): React.ReactNode {
  if (format === "badge") return <StatusBadge value={value == null ? undefined : String(value)} />;
  if (value == null || value === "") return "—";
  switch (format) {
    case "money":
      return formatCurrency(Number(value));
    case "number":
      return formatNumber(Number(value));
    case "percent":
      return formatPercent(Number(value));
    case "date":
      return formatDate(String(value), "short");
    default:
      return String(value);
  }
}

function csvValue(value: string | number | null | undefined, format?: ReportFormat): string | number {
  if (value == null) return "";
  if (format === "money" || format === "number" || format === "percent") return Number(value);
  if (format === "date") return formatDate(String(value));
  return String(value);
}

export function ReportTable({
  columns,
  rows,
  totals,
  exportFilename,
  hrefKey,
  title,
  searchable = true,
}: {
  columns: ReportColumn[];
  rows: ReportRow[];
  totals?: ReportRow;
  exportFilename: string;
  hrefKey?: string;
  title?: string;
  searchable?: boolean;
}) {
  const tableColumns: Column<ReportRow>[] = columns.map((c) => ({
    key: c.key,
    header: c.header,
    sortable: true,
    sortValue: (r) => {
      const v = r[c.key];
      if (c.format === "money" || c.format === "number" || c.format === "percent") {
        return Number(v ?? 0);
      }
      return v == null ? "" : String(v);
    },
    csv: (r) => csvValue(r[c.key], c.format),
    className: c.align === "right" ? "text-right" : undefined,
    headClassName: c.align === "right" ? "text-right" : undefined,
    cell: (r) => <span className={cn(c.format !== "badge" && "text-sm")}>{fmt(r[c.key], c.format)}</span>,
  }));

  const totalCols = totals
    ? columns.filter((c) => c.key in totals && totals[c.key] != null && c.format && c.format !== "text" && c.format !== "badge")
    : [];

  return (
    <div className="space-y-4">
      {/* Interactive view (hidden when printing) */}
      <div className="print:hidden space-y-4">
        <DataTable
          columns={tableColumns}
          data={rows}
          searchable={searchable ? (r) => columns.map((c) => String(r[c.key] ?? "")).join(" ") : undefined}
          searchPlaceholder="Search…"
          exportFilename={exportFilename}
          pageSize={15}
          getRowHref={hrefKey ? (r) => String(r[hrefKey] ?? "") : undefined}
          emptyTitle="No data"
          emptyDescription="There is nothing to report for this view yet."
          toolbarExtras={
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
            </Button>
          }
        />

        {totals && totalCols.length > 0 && (
          <div className="flex flex-wrap gap-x-8 gap-y-3 rounded-xl border border-border bg-muted/40 px-5 py-3.5">
            {totalCols.map((c) => (
              <div key={c.key}>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Total {c.header}
                </p>
                <p className="mt-0.5 font-semibold tabular-nums text-foreground">
                  {fmt(totals![c.key], c.format)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Print-only static table (all rows + totals) */}
      <div className="hidden print:block">
        {title && <h2 className="mb-3 text-lg font-semibold">{title}</h2>}
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key} className={c.align === "right" ? "text-right" : undefined}>
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>
                {columns.map((c) => (
                  <TableCell key={c.key} className={c.align === "right" ? "text-right" : undefined}>
                    {fmt(r[c.key], c.format)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {totals && (
              <TableRow className="font-semibold">
                {columns.map((c, idx) => (
                  <TableCell key={c.key} className={c.align === "right" ? "text-right" : undefined}>
                    {idx === 0 ? "Total" : c.key in totals && totals[c.key] != null ? fmt(totals[c.key], c.format) : ""}
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
