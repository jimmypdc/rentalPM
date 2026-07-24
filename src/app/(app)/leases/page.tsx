import Link from "next/link";
import type { Metadata } from "next";
import { Plus, CalendarClock } from "lucide-react";
import { listLeases } from "@/server/leases";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LeasesTable } from "@/components/lease/leases-table";

export const metadata: Metadata = { title: "Leases" };
export const dynamic = "force-dynamic";

export default async function LeasesPage() {
  const leases = await listLeases();

  const active = leases.filter(
    (l) => l.status !== "TERMINATED" && l.status !== "EXPIRED",
  );
  const within = (max: number, min = 0) =>
    active.filter(
      (l) => l.daysUntilEnd !== null && l.daysUntilEnd >= min && l.daysUntilEnd <= max,
    ).length;
  const buckets = [
    { label: "≤ 30 days", count: within(30), tone: "text-destructive" },
    { label: "31–60 days", count: within(60, 31), tone: "text-amber-600" },
    { label: "61–90 days", count: within(90, 61), tone: "text-amber-600" },
    { label: "91–120 days", count: within(120, 91), tone: "text-muted-foreground" },
  ];
  const hasExpiring = buckets.some((b) => b.count > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leases"
        description="Active and historical leases across your portfolio."
        actions={
          <Button asChild>
            <Link href="/leases/new">
              <Plus className="h-4 w-4" /> Add Lease
            </Link>
          </Button>
        }
      />

      {hasExpiring && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CalendarClock className="h-4 w-4 text-amber-600" />
              Leases expiring soon
            </div>
            {buckets.map((b) => (
              <div key={b.label} className="text-sm">
                <span className={`font-semibold tabular-nums ${b.tone}`}>{b.count}</span>{" "}
                <span className="text-muted-foreground">{b.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <LeasesTable data={leases} />
    </div>
  );
}
