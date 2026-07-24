"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toggleTaskComplete } from "@/server/tasks";
import { label } from "@/lib/enums";
import { formatDate, cn } from "@/lib/utils";

export interface TaskRow {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  dueDate: string | null;
  property: string | null;
  overdue: boolean;
  completedAt: string | null;
}

function CompleteToggle({ row }: { row: TaskRow }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const done = row.status === "COMPLETED";

  async function onToggle() {
    setPending(true);
    const result = await toggleTaskComplete(row.id);
    if (result.ok) {
      toast.success(done ? "Task reopened" : "Task completed");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    setPending(false);
  }

  return (
    <span onClick={(e) => e.stopPropagation()} className="inline-flex">
      <Checkbox checked={done} disabled={pending} onCheckedChange={() => void onToggle()} />
    </span>
  );
}

export function TasksTable({ data }: { data: TaskRow[] }) {
  const columns: Column<TaskRow>[] = [
    {
      key: "done",
      header: "",
      cell: (r) => <CompleteToggle row={r} />,
      className: "w-8",
    },
    {
      key: "title",
      header: "Title",
      sortable: true,
      sortValue: (r) => r.title,
      csv: (r) => r.title,
      cell: (r) => (
        <Link
          href={`/tasks/${r.id}/edit`}
          className={cn(
            "font-medium hover:text-primary",
            r.status === "COMPLETED" ? "text-muted-foreground line-through" : "text-foreground",
          )}
        >
          {r.title}
        </Link>
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
      key: "due",
      header: "Due",
      sortable: true,
      sortValue: (r) => r.dueDate ?? "",
      csv: (r) => (r.dueDate ? formatDate(r.dueDate) : ""),
      cell: (r) => {
        if (!r.dueDate) return <span className="text-muted-foreground">—</span>;
        return (
          <span className={cn("text-sm", r.overdue && "font-medium text-destructive")}>
            {formatDate(r.dueDate, "short")}
            {r.overdue && " (overdue)"}
          </span>
        );
      },
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
      key: "property",
      header: "Property",
      hideable: true,
      csv: (r) => r.property ?? "",
      cell: (r) => <span className="text-sm text-muted-foreground">{r.property ?? "—"}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchable={(r) => `${r.title} ${r.category} ${r.property ?? ""}`}
      searchPlaceholder="Search tasks…"
      exportFilename="tasks"
      emptyTitle="No tasks yet"
      emptyDescription="Add a task to keep track of what needs doing."
    />
  );
}
