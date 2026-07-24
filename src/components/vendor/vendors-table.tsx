"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Money } from "@/components/shared/money";
import { label } from "@/lib/enums";
import { formatDate, daysUntil } from "@/lib/utils";

export interface VendorRow {
  id: string;
  companyName: string;
  contactName: string | null;
  category: string;
  email: string | null;
  phone: string | null;
  preferred: boolean;
  wNineStatus: string;
  insuranceExpiration: string | null;
  hourlyRate: number;
  jobs: number;
  totalSpend: number;
}

export function VendorsTable({ data }: { data: VendorRow[] }) {
  const columns: Column<VendorRow>[] = [
    {
      key: "companyName",
      header: "Vendor",
      sortable: true,
      sortValue: (r) => r.companyName,
      csv: (r) => r.companyName,
      cell: (r) => (
        <div className="flex items-center gap-2">
          {r.preferred && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
          <div>
            <Link href={`/vendors/${r.id}`} className="font-medium text-foreground hover:text-primary">
              {r.companyName}
            </Link>
            {r.contactName && <p className="text-xs text-muted-foreground">{r.contactName}</p>}
          </div>
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
      key: "phone",
      header: "Contact",
      hideable: true,
      csv: (r) => r.phone ?? "",
      cell: (r) => (
        <div className="text-sm">
          <p>{r.phone ?? "—"}</p>
          {r.email && <p className="text-xs text-muted-foreground">{r.email}</p>}
        </div>
      ),
    },
    {
      key: "insurance",
      header: "Insurance",
      hideable: true,
      sortable: true,
      sortValue: (r) => r.insuranceExpiration ?? "",
      csv: (r) => (r.insuranceExpiration ? formatDate(r.insuranceExpiration) : ""),
      cell: (r) => {
        if (!r.insuranceExpiration) return <span className="text-muted-foreground">—</span>;
        const days = daysUntil(r.insuranceExpiration);
        const expired = days !== null && days < 0;
        return (
          <span className={expired ? "text-sm font-medium text-destructive" : "text-sm"}>
            {formatDate(r.insuranceExpiration, "short")}
            {expired && " (expired)"}
          </span>
        );
      },
    },
    {
      key: "w9",
      header: "W-9",
      hideable: true,
      csv: (r) => label(r.wNineStatus),
      cell: (r) => <StatusBadge value={r.wNineStatus} />,
    },
    {
      key: "jobs",
      header: "Jobs",
      sortable: true,
      sortValue: (r) => r.jobs,
      csv: (r) => r.jobs,
      cell: (r) => <span className="tabular-nums">{r.jobs}</span>,
    },
    {
      key: "spend",
      header: "Total Spend",
      sortable: true,
      sortValue: (r) => r.totalSpend,
      csv: (r) => r.totalSpend,
      className: "text-right",
      headClassName: "text-right",
      cell: (r) => <Money value={r.totalSpend} className="font-medium" />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchable={(r) => `${r.companyName} ${r.contactName ?? ""} ${r.category} ${r.email ?? ""} ${r.phone ?? ""}`}
      searchPlaceholder="Search vendors…"
      getRowHref={(r) => `/vendors/${r.id}`}
      exportFilename="vendors"
      emptyTitle="No vendors yet"
      emptyDescription="Add your first vendor or contractor to start tracking jobs and spend."
    />
  );
}
