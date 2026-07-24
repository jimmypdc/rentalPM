import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { listMaintenance, getMaintenanceBoard } from "@/server/maintenance";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MaintenanceBoard } from "@/components/maintenance/maintenance-board";
import { MaintenanceTable } from "@/components/maintenance/maintenance-table";

export const metadata: Metadata = { title: "Maintenance" };
export const dynamic = "force-dynamic";

const OPEN_STATUSES = new Set([
  "NEW", "ASSIGNED", "SCHEDULED", "IN_PROGRESS", "WAITING_ON_PARTS", "WAITING_ON_VENDOR",
]);

export default async function MaintenancePage() {
  const [rows, board] = await Promise.all([listMaintenance(), getMaintenanceBoard()]);

  const open = rows.filter((r) => OPEN_STATUSES.has(r.status)).length;
  const urgent = rows.filter(
    (r) => (r.priority === "HIGH" || r.priority === "EMERGENCY") && OPEN_STATUSES.has(r.status),
  ).length;
  const completed = rows.filter((r) => r.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance"
        description="Track work orders across your portfolio."
        actions={
          <Button asChild>
            <Link href="/maintenance/new">
              <Plus className="h-4 w-4" /> New Request
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Chip label="Open" value={open} tone="bg-blue-50 text-blue-700" />
        <Chip label="Urgent" value={urgent} tone="bg-red-50 text-red-700" />
        <Chip label="Completed" value={completed} tone="bg-green-50 text-green-700" />
      </div>

      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
        </TabsList>
        <TabsContent value="board">
          <MaintenanceBoard data={board} />
        </TabsContent>
        <TabsContent value="table">
          <MaintenanceTable data={rows} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Chip({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm">
      <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums ${tone}`}>
        {value}
      </span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
