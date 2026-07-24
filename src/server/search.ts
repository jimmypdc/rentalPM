import { prisma } from "@/lib/db";
import { fullName } from "@/lib/utils";
import type { SearchEntry } from "@/components/layout/global-search";

/** Lightweight cross-entity index for the command palette. */
export async function getSearchIndex(): Promise<SearchEntry[]> {
  const [properties, tenants, owners, vendors, units] = await Promise.all([
    prisma.property.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, street: true, city: true, state: true },
    }),
    prisma.tenant.findMany({
      where: { deletedAt: null },
      select: { id: true, firstName: true, lastName: true, email: true },
    }),
    prisma.owner.findMany({
      where: { deletedAt: null },
      select: { id: true, firstName: true, lastName: true, company: true },
    }),
    prisma.vendor.findMany({
      where: { deletedAt: null },
      select: { id: true, companyName: true, category: true },
    }),
    prisma.unit.findMany({
      where: { deletedAt: null },
      select: { id: true, number: true, property: { select: { name: true } } },
    }),
  ]);

  const entries: SearchEntry[] = [];
  for (const p of properties) {
    entries.push({
      group: "Properties",
      label: p.name,
      sublabel: `${p.street}, ${p.city}, ${p.state}`,
      href: `/properties/${p.id}`,
      keywords: `${p.street} ${p.city}`,
    });
  }
  for (const t of tenants) {
    entries.push({
      group: "Tenants",
      label: fullName(t),
      sublabel: t.email ?? "Tenant",
      href: `/tenants/${t.id}`,
    });
  }
  for (const o of owners) {
    entries.push({
      group: "Owners",
      label: fullName(o),
      sublabel: o.company ?? "Owner",
      href: `/owners/${o.id}`,
    });
  }
  for (const v of vendors) {
    entries.push({
      group: "Vendors",
      label: v.companyName,
      sublabel: v.category,
      href: `/vendors/${v.id}`,
    });
  }
  for (const u of units) {
    entries.push({
      group: "Units",
      label: `${u.property.name} — Unit ${u.number}`,
      sublabel: "Unit",
      href: `/units`,
    });
  }
  return entries;
}
