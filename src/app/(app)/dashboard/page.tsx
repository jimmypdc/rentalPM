import Link from "next/link";
import type { Metadata } from "next";
import {
  Building2, DoorOpen, Home, TrendingUp, CircleDollarSign, AlertCircle,
  Receipt, Wrench, PiggyBank, CalendarClock, Percent, Banknote,
  FileText, ClipboardCheck, ShieldAlert, Landmark, ListTodo, Activity,
} from "lucide-react";
import { getDashboardData } from "@/server/dashboard";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Money } from "@/components/shared/money";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PerformanceChart, OccupancyDonut } from "@/components/shared/charts";
import { formatCurrency, formatDate, formatPercent, timeAgo, daysUntil } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const d = await getDashboardData();
  const k = d.kpis;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Your portfolio at a glance — occupancy, cash flow, collections, and what needs attention."
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Properties" value={k.propertyCount} icon={Building2} href="/properties" />
        <StatCard label="Total Units" value={k.totalUnits} icon={DoorOpen} href="/units" accent="slate" />
        <StatCard label="Occupied" value={k.occupied} icon={Home} accent="green" href="/units" />
        <StatCard label="Vacant" value={k.vacant} icon={DoorOpen} accent="amber" href="/units" />
        <StatCard label="Occupancy" value={formatPercent(k.occupancyRate)} icon={Percent} accent="blue" />
        <StatCard label="Rent Roll / mo" value={formatCurrency(k.monthlyRentRoll, { compact: true })} icon={TrendingUp} accent="purple" href="/rent-roll" />
        <StatCard label="Collected (mo)" value={formatCurrency(k.rentCollected, { compact: true })} icon={CircleDollarSign} accent="green" href="/payments" />
        <StatCard label="Outstanding" value={formatCurrency(k.outstanding, { compact: true })} icon={AlertCircle} accent={k.outstanding > 0 ? "red" : "slate"} href="/payments" />
        <StatCard label="Op. Expenses (mo)" value={formatCurrency(k.operatingExpenses, { compact: true })} icon={Receipt} accent="amber" href="/expenses" />
        <StatCard label="Net Cash Flow (mo)" value={formatCurrency(k.netCashFlow, { compact: true })} icon={Banknote} accent={k.netCashFlow >= 0 ? "green" : "red"} href="/accounting" />
        <StatCard label="Deposits Held" value={formatCurrency(k.depositsHeld, { compact: true })} icon={PiggyBank} accent="blue" />
        <StatCard label="Open Maintenance" value={k.openMaintenance} icon={Wrench} accent={k.openMaintenance > 0 ? "amber" : "slate"} href="/maintenance" />
      </div>

      {/* Performance + occupancy */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Portfolio Performance</CardTitle>
              <p className="text-sm text-muted-foreground">
                Income, expenses, and net cash flow — trailing 12 months
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <PerformanceChart data={d.performance} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Occupancy</CardTitle>
            <p className="text-sm text-muted-foreground">Unit status breakdown</p>
          </CardHeader>
          <CardContent>
            <OccupancyDonut data={d.occupancy} />
            <div className="mt-2 space-y-1.5">
              {d.occupancy.map((o) => (
                <div key={o.key} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <StatusBadge value={o.key} />
                  </span>
                  <span className="font-medium tabular-nums">{o.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collection + maintenance */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Rent Collection</CardTitle>
            <p className="text-sm text-muted-foreground">Current month</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-semibold tracking-tight">
                  {formatPercent(d.collection.rate)}
                </p>
                <p className="text-xs text-muted-foreground">collection rate</p>
              </div>
              <div className="text-right text-sm">
                <Money value={d.collection.collected} className="font-semibold text-success" /> collected
              </div>
            </div>
            <Progress
              value={Math.min(100, d.collection.rate)}
              indicatorClassName="bg-success"
            />
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-muted/60 p-2">
                <p className="text-xs text-muted-foreground">Expected</p>
                <Money value={d.collection.expected} className="text-sm font-semibold" />
              </div>
              <div className="rounded-lg bg-muted/60 p-2">
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <Money value={d.collection.outstanding} className="text-sm font-semibold text-destructive" />
              </div>
              <div className="rounded-lg bg-muted/60 p-2">
                <p className="text-xs text-muted-foreground">Late</p>
                <p className="text-sm font-semibold">{d.collection.late}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance</CardTitle>
            <p className="text-sm text-muted-foreground">Open work overview</p>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {[
              { label: "New", key: "NEW" },
              { label: "In Progress", key: "IN_PROGRESS" },
              { label: "Waiting on Vendor", key: "WAITING_ON_VENDOR" },
              { label: "Waiting on Parts", key: "WAITING_ON_PARTS" },
              { label: "Completed", key: "COMPLETED" },
            ].map((row) => (
              <div key={row.key} className="flex items-center justify-between">
                <StatusBadge value={row.key} />
                <span className="text-sm font-semibold tabular-nums">
                  {d.maintenance.byStatus[row.key] ?? 0}
                </span>
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between rounded-lg bg-red-50 px-3 py-2">
              <span className="flex items-center gap-1.5 text-sm font-medium text-red-700">
                <ShieldAlert className="h-4 w-4" /> Urgent
              </span>
              <span className="text-sm font-semibold text-red-700">{d.maintenance.urgent}</span>
            </div>
            <Link href="/maintenance" className="block pt-1 text-sm font-medium text-primary hover:underline">
              View maintenance board →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent Payments</CardTitle>
            <Link href="/payments" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {d.recentPayments.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No payments yet.</p>
            ) : (
              d.recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b border-border/60 py-1.5 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.tenant}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(p.receivedOn, "short")} · {p.method}
                    </p>
                  </div>
                  <Money value={p.amount} className="text-sm font-semibold text-success" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming events + activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <p className="text-sm text-muted-foreground">
              Lease expirations, tasks, inspections, insurance & tax deadlines
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <EventList
                icon={FileText}
                title="Lease Expirations"
                empty="No leases expiring soon"
                items={d.upcoming.leases.map((l) => ({
                  href: `/leases/${l.id}`,
                  primary: `${l.property} · Unit ${l.unit}`,
                  secondary: l.tenant,
                  meta: dueLabel(l.endDate),
                }))}
              />
              <EventList
                icon={ListTodo}
                title="Tasks"
                empty="No open tasks"
                items={d.upcoming.tasks.map((t) => ({
                  href: `/tasks`,
                  primary: t.title,
                  secondary: t.status,
                  meta: t.dueDate ? dueLabel(t.dueDate) : "—",
                }))}
              />
              <EventList
                icon={ClipboardCheck}
                title="Inspections"
                empty="No inspections scheduled"
                items={d.upcoming.inspections.map((i) => ({
                  href: `/inspections`,
                  primary: i.property,
                  secondary: i.type,
                  meta: i.date ? dueLabel(i.date) : "—",
                }))}
              />
              <EventList
                icon={ShieldAlert}
                title="Insurance Renewals"
                empty="No renewals due"
                items={d.upcoming.insurance.map((i) => ({
                  href: `/properties`,
                  primary: i.property,
                  secondary: i.carrier,
                  meta: i.date ? dueLabel(i.date) : "—",
                }))}
              />
              {d.upcoming.taxes.length > 0 && (
                <EventList
                  icon={Landmark}
                  title="Property Tax Deadlines"
                  empty="No tax deadlines"
                  items={d.upcoming.taxes.map((t) => ({
                    href: `/properties`,
                    primary: t.property,
                    secondary: formatCurrency(t.amount),
                    meta: t.date ? dueLabel(t.date) : "—",
                  }))}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {d.recentActivity.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              d.recentActivity.map((a) => (
                <div key={a.id} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary/60" />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{a.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.property ? `${a.property} · ` : ""}
                      {timeAgo(a.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function dueLabel(iso: string): string {
  const days = daysUntil(iso);
  if (days === null) return "—";
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `in ${days}d`;
}

function EventList({
  icon: Icon,
  title,
  items,
  empty,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: { href: string; primary: string; secondary: string; meta: string }[];
  empty: string;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {title}
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="space-y-1.5">
          {items.slice(0, 4).map((it, i) => (
            <Link
              key={i}
              href={it.href}
              className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{it.primary}</p>
                <p className="truncate text-xs capitalize text-muted-foreground">
                  {it.secondary.toLowerCase().replace(/_/g, " ")}
                </p>
              </div>
              <span className="shrink-0 text-xs font-medium text-muted-foreground">
                {it.meta}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
