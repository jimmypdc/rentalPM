import { prisma } from "@/lib/db";

/** Append an activity-log entry (best-effort; never throws into a mutation). */
export async function logActivity(input: {
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  propertyId?: string;
  userId?: string;
}) {
  try {
    await prisma.activityLog.create({ data: input });
  } catch {
    // swallow — activity logging must never break a write
  }
}

/** Parse a form/string value into a Date or null. */
export function toDate(v: FormDataEntryValue | string | null | undefined): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Parse a numeric form value into a number or null. */
export function toNum(
  v: FormDataEntryValue | string | null | undefined,
): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : null;
}
