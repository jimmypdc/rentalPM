import type { Metadata } from "next";
import { getAccounting, getAccountingFilters } from "@/server/accounting";
import { PageHeader } from "@/components/shared/page-header";
import { AccountingView } from "@/components/accounting/accounting-view";

export const metadata: Metadata = { title: "Accounting" };
export const dynamic = "force-dynamic";

export default async function AccountingPage({
  searchParams,
}: {
  searchParams: Promise<{ propertyId?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const propertyId = sp.propertyId || undefined;
  const yearNum = sp.year ? Number(sp.year) : undefined;
  const year = yearNum && Number.isFinite(yearNum) ? yearNum : undefined;

  const [data, filters] = await Promise.all([
    getAccounting({ propertyId, year }),
    getAccountingFilters(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounting"
        description="Portfolio P&L, cash flow, and expense breakdowns. Lightweight reporting — not a QuickBooks replacement."
      />
      <AccountingView data={data} filters={filters} selected={{ propertyId, year }} />
    </div>
  );
}
