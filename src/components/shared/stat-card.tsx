import { type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = "blue",
  trend,
  href,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  accent?: "blue" | "green" | "amber" | "red" | "purple" | "slate";
  trend?: { value: string; positive?: boolean };
  href?: string;
}) {
  const accentBg: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-violet-50 text-violet-600",
    slate: "bg-slate-100 text-slate-600",
  };
  const inner = (
    <Card
      className={cn(
        "p-4 transition-shadow",
        href && "cursor-pointer hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          {trend && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                trend.positive ? "text-success" : "text-destructive",
              )}
            >
              {trend.value}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              accentBg[accent],
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </Card>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
