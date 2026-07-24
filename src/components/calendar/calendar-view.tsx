"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import type { CalendarEvent, CalendarEventType } from "@/server/calendar";

const EVENT_META: Record<
  CalendarEventType,
  { label: string; dot: string; chip: string }
> = {
  RENT_DUE: { label: "Rent Due", dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700" },
  LEASE_EXPIRATION: { label: "Lease Expiration", dot: "bg-amber-500", chip: "bg-amber-50 text-amber-700" },
  INSPECTION: { label: "Inspection", dot: "bg-blue-500", chip: "bg-blue-50 text-blue-700" },
  MAINTENANCE: { label: "Maintenance", dot: "bg-violet-500", chip: "bg-violet-50 text-violet-700" },
  VENDOR_APPOINTMENT: { label: "Vendor Appointment", dot: "bg-indigo-500", chip: "bg-indigo-50 text-indigo-700" },
  TASK: { label: "Task", dot: "bg-slate-500", chip: "bg-slate-100 text-slate-700" },
  INSURANCE_RENEWAL: { label: "Insurance Renewal", dot: "bg-rose-500", chip: "bg-rose-50 text-rose-700" },
  PROPERTY_TAX: { label: "Property Tax", dot: "bg-cyan-600", chip: "bg-cyan-50 text-cyan-700" },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function CalendarView({ events }: { events: CalendarEvent[] }) {
  const router = useRouter();
  const [cursor, setCursor] = React.useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const parsed = React.useMemo(
    () => events.map((e) => ({ ...e, when: new Date(e.date) })),
    [events],
  );

  // Group events by calendar day for the grid.
  const byDay = React.useMemo(() => {
    const map = new Map<string, typeof parsed>();
    for (const e of parsed) {
      const k = dayKey(e.when);
      const arr = map.get(k);
      if (arr) arr.push(e);
      else map.set(k, [e]);
    }
    return map;
  }, [parsed]);

  // Build a 6-week grid starting on the Sunday of the week containing the 1st.
  const gridStart = React.useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const s = new Date(first);
    s.setDate(first.getDate() - first.getDay());
    return s;
  }, [cursor]);

  const days = React.useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => {
        const d = new Date(gridStart);
        d.setDate(gridStart.getDate() + i);
        return d;
      }),
    [gridStart],
  );

  const [today] = React.useState(() => new Date());
  const todayKey = dayKey(today);
  const startOfTodayMs = React.useMemo(() => {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [today]);

  const upcoming = React.useMemo(() => {
    return parsed
      .filter((e) => e.when.getTime() >= startOfTodayMs)
      .sort((a, b) => a.when.getTime() - b.when.getTime())
      .slice(0, 12);
  }, [parsed, startOfTodayMs]);

  const monthLabel = cursor.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{monthLabel}</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCursor(new Date(today.getFullYear(), today.getMonth(), 1))
              }
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous month"
              onClick={() =>
                setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Next month"
              onClick={() =>
                setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden p-0">
          <div className="grid grid-cols-7 border-b border-border bg-muted/40">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="px-2 py-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((d) => {
              const inMonth = d.getMonth() === cursor.getMonth();
              const k = dayKey(d);
              const dayEvents = byDay.get(k) ?? [];
              const isToday = k === todayKey;
              return (
                <div
                  key={k}
                  className={cn(
                    "min-h-[104px] border-b border-r border-border p-1.5 last:border-r-0",
                    !inMonth && "bg-muted/30 text-muted-foreground",
                  )}
                >
                  <div className="mb-1 flex items-center justify-between px-0.5">
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs tabular-nums",
                        isToday
                          ? "bg-primary font-semibold text-primary-foreground"
                          : inMonth
                            ? "text-foreground"
                            : "text-muted-foreground",
                      )}
                    >
                      {d.getDate()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((e) => {
                      const meta = EVENT_META[e.type];
                      return (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => router.push(e.href)}
                          title={`${e.title} — ${e.subtitle}`}
                          className={cn(
                            "flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[11px] font-medium hover:opacity-80",
                            meta.chip,
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dot)} />
                          <span className="truncate">{e.title}</span>
                        </button>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <p className="px-1 text-[11px] text-muted-foreground">
                        +{dayEvents.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {(Object.keys(EVENT_META) as CalendarEventType[]).map((t) => (
            <div key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("h-2.5 w-2.5 rounded-full", EVENT_META[t].dot)} />
              {EVENT_META[t].label}
            </div>
          ))}
        </div>
      </div>

      <Card className="h-fit p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <CalendarDays className="h-4 w-4 text-muted-foreground" /> Upcoming
        </h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming events in the next 60 days.</p>
        ) : (
          <ul className="space-y-1">
            {upcoming.map((e) => {
              const meta = EVENT_META[e.type];
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => router.push(e.href)}
                    className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-accent"
                  >
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", meta.dot)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{e.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{e.subtitle}</p>
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formatDate(e.when, "short")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
