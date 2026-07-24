import Link from "next/link";
import type { Metadata } from "next";
import { Plus, Info } from "lucide-react";
import { listDocuments } from "@/server/documents";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { DocumentsTable } from "@/components/document/documents-table";
import { label } from "@/lib/enums";

export const metadata: Metadata = { title: "Documents" };
export const dynamic = "force-dynamic";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const documents = await listDocuments();
  const rows = category
    ? documents.filter((d) => d.category === category)
    : documents;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Leases, receipts, policies, and records across your portfolio."
        actions={
          <Button asChild>
            <Link href="/documents/new">
              <Plus className="h-4 w-4" /> Add Document
            </Link>
          </Button>
        }
      />

      <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          File upload &amp; storage is architected but not yet wired — this is
          document metadata management for now.
          {category && (
            <>
              {" "}Filtered by{" "}
              <span className="font-medium text-foreground">{label(category)}</span>.{" "}
              <Link href="/documents" className="text-primary hover:underline">
                Clear
              </Link>
            </>
          )}
        </p>
      </div>

      <DocumentsTable data={rows} />
    </div>
  );
}
