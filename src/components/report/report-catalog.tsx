"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { REPORTS, type ReportMeta } from "@/lib/reports-catalog";

export { REPORTS, type ReportMeta };

const ACCENT: Record<ReportMeta["accent"], string> = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  purple: "bg-violet-50 text-violet-600",
  slate: "bg-slate-100 text-slate-600",
};

export function ReportCatalog() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {REPORTS.map((r) => {
        const Icon = r.icon;
        return (
          <Link key={r.slug} href={`/reports/${r.slug}`} className="group">
            <Card className="flex h-full flex-col gap-3 p-5 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", ACCENT[r.accent])}>
                  <Icon className="h-5 w-5" />
                </div>
                {r.comingSoon && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    Coming soon
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary">{r.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
