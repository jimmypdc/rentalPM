import Link from "next/link";
import type { Metadata } from "next";
import { Plus, AlertTriangle, CalendarClock } from "lucide-react";
import { listTasks } from "@/server/tasks";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { TasksTable } from "@/components/task/tasks-table";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Tasks" };
export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const rows = await listTasks();

  const overdue = rows.filter((r) => r.overdue);
  const upcoming = rows
    .filter((r) => !r.overdue && r.status !== "COMPLETED" && r.dueDate)
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Your to-do list across the portfolio."
        actions={
          <Button asChild>
            <Link href="/tasks/new">
              <Plus className="h-4 w-4" /> Add Task
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Widget
          title="Overdue"
          icon={AlertTriangle}
          tone="text-destructive"
          rows={overdue.slice(0, 6)}
          empty="Nothing overdue. Nice work."
        />
        <Widget
          title="Upcoming"
          icon={CalendarClock}
          tone="text-blue-600"
          rows={upcoming}
          empty="No upcoming tasks scheduled."
        />
      </div>

      <TasksTable data={rows} />
    </div>
  );
}

function Widget({
  title,
  icon: Icon,
  tone,
  rows,
  empty,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  rows: { id: string; title: string; priority: string; dueDate: string | null }[];
  empty: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`h-4 w-4 ${tone}`} />
          {title}
          <span className="text-sm font-normal text-muted-foreground">({rows.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">{empty}</p>
        ) : (
          rows.map((r) => (
            <Link
              key={r.id}
              href={`/tasks/${r.id}/edit`}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50"
            >
              <span className="truncate font-medium">{r.title}</span>
              <span className="flex shrink-0 items-center gap-2">
                <StatusBadge value={r.priority} />
                <span className="text-xs text-muted-foreground">{formatDate(r.dueDate, "short")}</span>
              </span>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
