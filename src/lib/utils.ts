import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Numeric = number | string | { toString(): string } | null | undefined;

/** Coerce a Prisma Decimal / string / number to a plain number. */
export function num(value: Numeric): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const n = Number(value.toString());
  return Number.isFinite(n) ? n : 0;
}

export function formatCurrency(
  value: Numeric,
  opts: { compact?: boolean; cents?: boolean } = {},
): string {
  const n = num(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: opts.compact ? "compact" : "standard",
    minimumFractionDigits: opts.cents === false ? 0 : opts.compact ? 0 : 0,
    maximumFractionDigits: opts.compact ? 1 : opts.cents ? 2 : 0,
  }).format(n);
}

export function formatPercent(value: Numeric, digits = 1): string {
  return `${num(value).toFixed(digits)}%`;
}

export function formatNumber(value: Numeric): string {
  return new Intl.NumberFormat("en-US").format(num(value));
}

export function formatDate(
  value: Date | string | null | undefined,
  style: "short" | "medium" | "long" = "medium",
): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  const opts: Intl.DateTimeFormatOptions =
    style === "short"
      ? { month: "numeric", day: "numeric", year: "2-digit" }
      : style === "long"
        ? { month: "long", day: "numeric", year: "numeric" }
        : { month: "short", day: "numeric", year: "numeric" };
  return new Intl.DateTimeFormat("en-US", opts).format(d);
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

/** Relative "3 days ago" style helper. */
export function timeAgo(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Days between now and a future date (negative if past). */
export function daysUntil(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - start.getTime()) / 86400000);
}

export function fullName(
  p: { firstName?: string | null; lastName?: string | null } | null | undefined,
): string {
  if (!p) return "—";
  return [p.firstName, p.lastName].filter(Boolean).join(" ") || "—";
}
