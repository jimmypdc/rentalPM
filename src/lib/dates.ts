export interface MonthBucket {
  key: string; // YYYY-MM
  label: string; // "Jan"
  start: Date;
  end: Date;
}

export function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Last `count` months (inclusive of current), oldest first. */
export function lastNMonths(count = 12, from = new Date()): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const ref = new Date(from.getFullYear(), from.getMonth() - i, 1);
    buckets.push({
      key: `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}`,
      label: ref.toLocaleString("en-US", { month: "short" }),
      start: new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0),
      end: new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999),
    });
  }
  return buckets;
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
