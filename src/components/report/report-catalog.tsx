"use client";

import Link from "next/link";
import {
  ScrollText,
  FileBarChart,
  Building2,
  TrendingUp,
  Receipt,
  CircleDollarSign,
  AlertTriangle,
  CalendarClock,
  DoorOpen,
  Wrench,
  HardHat,
  PiggyBank,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ReportMeta {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: "blue" | "green" | "amber" | "red" | "purple" | "slate";
  comingSoon?: boolean;
}

export const REPORTS: ReportMeta[] = [
  { slug: "rent-roll", title: "Rent Roll", description: "Active leases with rent, paid, and outstanding balance by unit.", icon: ScrollText, accent: "blue" },
  { slug: "income-statement", title: "Income Statement", description: "Income by charge type and expenses by category with NOI.", icon: FileBarChart, accent: "green" },
  { slug: "property-pnl", title: "Property P&L", description: "Portfolio profit & loss — revenue, expenses, and net income.", icon: Building2, accent: "green" },
  { slug: "cash-flow", title: "Cash Flow", description: "Monthly income, expenses, and net cash flow over 12 months.", icon: TrendingUp, accent: "blue" },
  { slug: "expense-report", title: "Expense Report", description: "Operating expenses grouped by category for the period.", icon: Receipt, accent: "amber" },
  { slug: "rent-collection", title: "Rent Collection", description: "Billed vs. collected rent and collection rate over time.", icon: CircleDollarSign, accent: "green", comingSoon: true },
  { slug: "delinquency", title: "Delinquency", description: "Tenants with overdue balances, amount owed, and days late.", icon: AlertTriangle, accent: "red" },
  { slug: "lease-expiration", title: "Lease Expiration", description: "Upcoming lease endings sorted by date with alert buckets.", icon: CalendarClock, accent: "amber" },
  { slug: "occupancy", title: "Occupancy", description: "Occupied vs. vacant units and occupancy rate per property.", icon: DoorOpen, accent: "purple" },
  { slug: "maintenance-cost", title: "Maintenance Cost", description: "Work order counts and total maintenance cost per property.", icon: Wrench, accent: "slate" },
  { slug: "vendor-spend", title: "Vendor Spend", description: "Jobs, total spend, and average per vendor across the portfolio.", icon: HardHat, accent: "purple" },
  { slug: "security-deposit", title: "Security Deposit", description: "Deposits held and refunded with per-lease detail.", icon: PiggyBank, accent: "blue" },
  { slug: "property-performance", title: "Property Performance", description: "Income, expenses, NOI, cash flow, and cap rate per property.", icon: Gauge, accent: "green" },
];

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
