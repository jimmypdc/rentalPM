import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";
import { DocumentForm } from "@/components/document/document-form";
import { getDocumentFormData } from "@/server/documents";

export const metadata: Metadata = { title: "Add Document" };
export const dynamic = "force-dynamic";

export default async function NewDocumentPage() {
  const formData = await getDocumentFormData();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href="/documents" label="Documents" />
      <PageHeader
        title="Add Document"
        description="Record document metadata and link it to related records."
      />
      <DocumentForm {...formData} />
    </div>
  );
}
