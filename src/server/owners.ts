"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { num } from "@/lib/utils";
import { ownerSchema } from "@/lib/validations/owner";
import { logActivity, toNum } from "@/server/common";
import { ok, fail, type ActionResult } from "@/types";

const ACTIVE_LEASE = ["ACTIVE", "EXPIRING_SOON", "MONTH_TO_MONTH"] as const;

export async function listOwners() {
  const owners = await prisma.owner.findMany({
    where: { deletedAt: null },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      properties: {
        include: {
          property: {
            select: {
              units: { where: { deletedAt: null }, select: { id: true } },
              leases: {
                where: { status: { in: [...ACTIVE_LEASE] }, deletedAt: null },
                select: { rent: true },
              },
            },
          },
        },
      },
    },
  });

  return owners.map((o) => {
    const unitCount = o.properties.reduce((s, po) => s + po.property.units.length, 0);
    const monthlyRent = o.properties.reduce(
      (s, po) => s + po.property.leases.reduce((ls, l) => ls + num(l.rent), 0),
      0,
    );
    return {
      id: o.id,
      firstName: o.firstName,
      lastName: o.lastName,
      company: o.company,
      isSelf: o.isSelf,
      email: o.email,
      phone: o.phone,
      propertyCount: o.properties.length,
      unitCount,
      monthlyRent,
      managementFeePercent: num(o.managementFeePercent),
    };
  });
}

export async function getOwner(id: string) {
  const owner = await prisma.owner.findFirst({
    where: { id, deletedAt: null },
    include: {
      properties: {
        include: {
          property: {
            include: {
              units: { where: { deletedAt: null } },
              leases: {
                where: { status: { in: [...ACTIVE_LEASE] }, deletedAt: null },
                select: { rent: true },
              },
            },
          },
        },
      },
      distributions: {
        orderBy: { date: "desc" },
        include: { property: { select: { name: true } } },
      },
      contributions: {
        orderBy: { date: "desc" },
        include: { property: { select: { name: true } } },
      },
      documents: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!owner) return null;

  const propertyIds = owner.properties.map((po) => po.propertyId);
  const since = new Date();
  since.setMonth(since.getMonth() - 12);
  const expenseAgg = propertyIds.length
    ? await prisma.expense.aggregate({
        _sum: { amount: true },
        where: { propertyId: { in: propertyIds }, voidedAt: null, date: { gte: since } },
      })
    : { _sum: { amount: null } };

  const properties = owner.properties.map((po) => {
    const p = po.property;
    const unitCount = p.units.length;
    const occupiedCount = p.units.filter((u) => u.status === "OCCUPIED").length;
    const monthlyIncome = p.leases.reduce((s, l) => s + num(l.rent), 0);
    return {
      id: po.propertyId,
      name: p.name,
      city: p.city,
      state: p.state,
      type: p.type,
      status: p.status,
      unitCount,
      occupiedCount,
      occupancy: unitCount ? (occupiedCount / unitCount) * 100 : 0,
      monthlyIncome,
      ownershipPercent: num(po.ownershipPercent),
    };
  });

  const totalUnits = properties.reduce((s, p) => s + p.unitCount, 0);
  const occupiedUnits = properties.reduce((s, p) => s + p.occupiedCount, 0);
  const occupancy = totalUnits ? (occupiedUnits / totalUnits) * 100 : 0;
  const monthlyRentalIncome = properties.reduce((s, p) => s + p.monthlyIncome, 0);
  const trailing12Expenses = num(expenseAgg._sum.amount);
  const feePercent = num(owner.managementFeePercent);
  const managementFees = monthlyRentalIncome * (feePercent / 100);
  const totalDistributions = owner.distributions.reduce((s, d) => s + num(d.amount), 0);
  const totalContributions = owner.contributions.reduce((s, c) => s + num(c.amount), 0);

  return {
    owner,
    properties,
    stats: {
      propertyCount: owner.properties.length,
      totalUnits,
      occupancy,
      monthlyRentalIncome,
      trailing12Expenses,
      managementFees,
      totalDistributions,
      totalContributions,
      feePercent,
    },
  };
}

function parse(formData: FormData) {
  return ownerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    company: formData.get("company"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    street: formData.get("street"),
    city: formData.get("city"),
    state: formData.get("state"),
    zip: formData.get("zip"),
    contactMethod: formData.get("contactMethod"),
    isSelf: formData.get("isSelf") === "true" || formData.get("isSelf") === "on",
    taxId: formData.get("taxId"),
    paymentInfo: formData.get("paymentInfo"),
    managementFeePercent: formData.get("managementFeePercent") || undefined,
    notes: formData.get("notes"),
  });
}

export async function createOwner(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Please fix the errors and try again.", parsed.error.flatten().fieldErrors);
  }
  const d = parsed.data;
  const owner = await prisma.owner.create({
    data: {
      firstName: d.firstName,
      lastName: d.lastName,
      company: d.company,
      email: d.email || null,
      phone: d.phone,
      street: d.street,
      city: d.city,
      state: d.state,
      zip: d.zip,
      contactMethod: d.contactMethod,
      isSelf: d.isSelf,
      taxId: d.taxId,
      paymentInfo: d.paymentInfo,
      managementFeePercent: toNum(d.managementFeePercent) ?? 0,
      notes: d.notes,
    },
  });
  await logActivity({
    action: "OWNER_CREATED", entityType: "Owner", entityId: owner.id,
    summary: `Added owner ${owner.firstName} ${owner.lastName}`, userId: user.id,
  });
  revalidatePath("/owners");
  return ok({ id: owner.id });
}

export async function updateOwner(
  id: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) {
    return fail("Please fix the errors and try again.", parsed.error.flatten().fieldErrors);
  }
  const d = parsed.data;
  await prisma.owner.update({
    where: { id },
    data: {
      firstName: d.firstName,
      lastName: d.lastName,
      company: d.company,
      email: d.email || null,
      phone: d.phone,
      street: d.street,
      city: d.city,
      state: d.state,
      zip: d.zip,
      contactMethod: d.contactMethod,
      isSelf: d.isSelf,
      taxId: d.taxId,
      paymentInfo: d.paymentInfo,
      managementFeePercent: toNum(d.managementFeePercent) ?? 0,
      notes: d.notes,
    },
  });
  await logActivity({
    action: "OWNER_UPDATED", entityType: "Owner", entityId: id,
    summary: `Updated owner ${d.firstName} ${d.lastName}`, userId: user.id,
  });
  revalidatePath("/owners");
  revalidatePath(`/owners/${id}`);
  return ok({ id });
}

export async function deleteOwner(id: string): Promise<ActionResult> {
  const user = await requireUser();
  await prisma.owner.update({ where: { id }, data: { deletedAt: new Date() } });
  await logActivity({
    action: "OWNER_DELETED", entityType: "Owner", entityId: id,
    summary: "Archived an owner", userId: user.id,
  });
  revalidatePath("/owners");
  return ok(undefined);
}
