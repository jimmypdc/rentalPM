"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { num } from "@/lib/utils";
import { computePropertyFinancials } from "@/lib/metrics";
import { propertySchema, type PropertyInput } from "@/lib/validations/property";
import { logActivity, toDate, toNum } from "@/server/common";
import { ok, fail, type ActionResult } from "@/types";

const ACTIVE_LEASE = ["ACTIVE", "EXPIRING_SOON", "MONTH_TO_MONTH"] as const;

// Operating expenses for NOI exclude debt service (interest) and capex.
const NON_OPERATING = ["MORTGAGE_INTEREST", "CAPITAL_IMPROVEMENT"] as const;

/** Coerce a form value to an integer or null (for Prisma Int columns). */
function toInt(v: string | null | undefined): number | null {
  const n = toNum(v);
  return n === null ? null : Math.trunc(n);
}

export async function listProperties() {
  const properties = await prisma.property.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    include: {
      units: { where: { deletedAt: null }, select: { id: true, status: true } },
      leases: {
        where: { status: { in: [...ACTIVE_LEASE] }, deletedAt: null },
        select: { rent: true, unitId: true },
      },
    },
  });

  return properties.map((p) => {
    const occupiedUnitIds = new Set(p.leases.map((l) => l.unitId));
    const monthlyRent = p.leases.reduce((s, l) => s + num(l.rent), 0);
    return {
      id: p.id,
      name: p.name,
      type: p.type,
      status: p.status,
      street: p.street,
      city: p.city,
      state: p.state,
      zip: p.zip,
      estimatedValue: num(p.estimatedValue),
      unitCount: p.units.length,
      occupiedCount: occupiedUnitIds.size,
      monthlyRent,
    };
  });
}

export async function getProperty(id: string) {
  const property = await prisma.property.findFirst({
    where: { id, deletedAt: null },
    include: {
      units: { where: { deletedAt: null }, orderBy: { number: "asc" } },
      leases: {
        where: { status: { in: [...ACTIVE_LEASE] }, deletedAt: null },
        orderBy: { endDate: "asc" },
        include: {
          unit: { select: { id: true, number: true } },
          tenants: {
            include: {
              tenant: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            },
          },
        },
      },
      mortgage: true,
      insurancePolicies: { orderBy: { expirationDate: "asc" } },
      propertyTaxes: { orderBy: { year: "desc" } },
      maintenanceRequests: {
        orderBy: { reportedDate: "desc" },
        take: 10,
        include: { unit: { select: { number: true } }, vendor: { select: { companyName: true } } },
      },
      expenses: {
        where: { voidedAt: null },
        orderBy: { date: "desc" },
        take: 10,
        include: { vendor: { select: { companyName: true } } },
      },
      documents: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
      inspections: { where: { deletedAt: null }, orderBy: { inspectionDate: "desc" }, take: 10 },
      owners: { include: { owner: true } },
      activityLogs: { orderBy: { createdAt: "desc" }, take: 15, include: { user: { select: { name: true } } } },
    },
  });
  if (!property) return null;

  // Trailing-12-month expenses for operating-expense figures.
  const since = new Date();
  since.setMonth(since.getMonth() - 12);
  const ttmExpenses = await prisma.expense.findMany({
    where: { propertyId: id, voidedAt: null, date: { gte: since } },
    select: { category: true, amount: true },
  });
  const operatingExpenses = ttmExpenses
    .filter((e) => !NON_OPERATING.includes(e.category as (typeof NON_OPERATING)[number]))
    .reduce((s, e) => s + num(e.amount), 0);

  // Annualized gross rent: prefer unit market rent, else the unit's active lease rent.
  const rentByUnit = new Map<string, number>();
  for (const lease of property.leases) {
    if (lease.unit) rentByUnit.set(lease.unit.id, num(lease.rent));
  }
  const monthlyGross = property.units.reduce((s, u) => {
    const market = num(u.marketRent);
    return s + (market > 0 ? market : rentByUnit.get(u.id) ?? 0);
  }, 0);
  const annualGrossRent = monthlyGross * 12;

  const estimatedValue = num(property.estimatedValue);
  const mortgageBalance = num(property.mortgage?.balance);
  const annualDebtService = num(property.mortgage?.monthlyPayment) * 12;

  const purchasePrice = num(property.purchasePrice);
  const originalAmount = num(property.mortgage?.originalAmount);
  const cashInvested =
    originalAmount > 0
      ? purchasePrice - originalAmount
      : purchasePrice > 0
        ? purchasePrice * 0.2
        : 0;

  const financials = computePropertyFinancials({
    annualGrossRent,
    vacancyLoss: 0,
    otherIncome: 0,
    operatingExpenses,
    annualDebtService,
    estimatedValue,
    mortgageBalance,
    cashInvested,
  });

  const occupiedUnitIds = new Set(
    property.leases.map((l) => l.unit?.id).filter((v): v is string => Boolean(v)),
  );
  const unitCount = property.units.length;
  const occupiedCount = occupiedUnitIds.size;

  return {
    property,
    financials,
    aggregates: {
      unitCount,
      occupiedCount,
      vacantCount: Math.max(0, unitCount - occupiedCount),
      occupancyRate: unitCount ? (occupiedCount / unitCount) * 100 : 0,
      monthlyRent: property.leases.reduce((s, l) => s + num(l.rent), 0),
      annualDebtService,
      operatingExpenses,
      activeLeaseCount: property.leases.length,
    },
  };
}

function parse(formData: FormData) {
  return propertySchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    status: formData.get("status"),
    street: formData.get("street"),
    city: formData.get("city"),
    state: formData.get("state"),
    zip: formData.get("zip"),
    county: formData.get("county"),
    purchaseDate: formData.get("purchaseDate"),
    purchasePrice: formData.get("purchasePrice"),
    estimatedValue: formData.get("estimatedValue"),
    propertyTaxAnnual: formData.get("propertyTaxAnnual"),
    insuranceAnnual: formData.get("insuranceAnnual"),
    hoaMonthly: formData.get("hoaMonthly"),
    squareFeet: formData.get("squareFeet"),
    yearBuilt: formData.get("yearBuilt"),
    bedrooms: formData.get("bedrooms"),
    bathrooms: formData.get("bathrooms"),
    ownerEntity: formData.get("ownerEntity"),
    notes: formData.get("notes"),
  });
}

function toData(d: PropertyInput) {
  return {
    name: d.name,
    type: d.type,
    status: d.status,
    street: d.street,
    city: d.city,
    state: d.state || "FL",
    zip: d.zip,
    county: d.county || null,
    purchaseDate: toDate(d.purchaseDate),
    purchasePrice: toNum(d.purchasePrice),
    estimatedValue: toNum(d.estimatedValue),
    propertyTaxAnnual: toNum(d.propertyTaxAnnual),
    insuranceAnnual: toNum(d.insuranceAnnual),
    hoaMonthly: toNum(d.hoaMonthly),
    squareFeet: toInt(d.squareFeet),
    yearBuilt: toInt(d.yearBuilt),
    bedrooms: toInt(d.bedrooms),
    bathrooms: toNum(d.bathrooms),
    ownerEntity: d.ownerEntity || null,
    notes: d.notes || null,
  };
}

export async function createProperty(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Please fix the errors and try again.", parsed.error.flatten().fieldErrors);
  }
  const property = await prisma.property.create({ data: toData(parsed.data) });
  await logActivity({
    action: "PROPERTY_CREATED", entityType: "Property", entityId: property.id,
    summary: `Added property ${property.name}`, propertyId: property.id, userId: user.id,
  });
  revalidatePath("/properties");
  return ok({ id: property.id });
}

export async function updateProperty(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Please fix the errors and try again.", parsed.error.flatten().fieldErrors);
  }
  await prisma.property.update({ where: { id }, data: toData(parsed.data) });
  await logActivity({
    action: "PROPERTY_UPDATED", entityType: "Property", entityId: id,
    summary: `Updated property ${parsed.data.name}`, propertyId: id, userId: user.id,
  });
  revalidatePath("/properties");
  revalidatePath(`/properties/${id}`);
  return ok({ id });
}

export async function deleteProperty(id: string): Promise<ActionResult> {
  const user = await requireUser();
  await prisma.property.update({ where: { id }, data: { deletedAt: new Date() } });
  await logActivity({
    action: "PROPERTY_DELETED", entityType: "Property", entityId: id,
    summary: "Archived a property", propertyId: id, userId: user.id,
  });
  revalidatePath("/properties");
  return ok(undefined);
}
