"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UploadCloud } from "lucide-react";
import { documentSchema, type DocumentInput } from "@/lib/validations/document";
import { createDocument, updateDocument } from "@/server/documents";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField, FormGrid, FormSection } from "@/components/shared/form-field";
import { SelectField } from "@/components/shared/rhf";
import { optionsFrom, DocumentCategoryValues } from "@/lib/enums";
import type { SelectOption } from "@/types";

const NONE: SelectOption = { value: "NONE", label: "None" };

export interface DocumentFormValues extends Partial<DocumentInput> {
  id?: string;
}

export function DocumentForm({
  initial,
  properties,
  tenants,
  owners,
  vendors,
  leases,
}: {
  initial?: DocumentFormValues;
  properties: SelectOption[];
  tenants: SelectOption[];
  owners: SelectOption[];
  vendors: SelectOption[];
  leases: SelectOption[];
}) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [pending, setPending] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<DocumentInput>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      name: initial?.name ?? "",
      category: initial?.category ?? "OTHER",
      propertyId: initial?.propertyId || NONE.value,
      tenantId: initial?.tenantId || NONE.value,
      leaseId: initial?.leaseId || NONE.value,
      ownerId: initial?.ownerId || NONE.value,
      vendorId: initial?.vendorId || NONE.value,
      notes: initial?.notes ?? "",
    },
  });

  async function onSubmit(values: DocumentInput) {
    setPending(true);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.set(k, String(v));
    });
    const result = isEdit
      ? await updateDocument(initial!.id!, fd)
      : await createDocument(fd);
    if (result.ok) {
      toast.success(isEdit ? "Document updated" : "Document saved");
      router.push("/documents");
      router.refresh();
    } else {
      toast.error(result.error);
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <UploadCloud className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <p>
          File upload &amp; storage is architected but not yet wired — the storage
          layer is abstracted. For now this records document{" "}
          <span className="font-medium text-foreground">metadata</span> and links
          it to the related record.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <FormSection title="Document details">
            <FormGrid>
              <FormField label="Name" required error={errors.name?.message}>
                <Input {...register("name")} placeholder="Signed lease — Unit 2B" />
              </FormField>
              <FormField label="Category" required error={errors.category?.message}>
                <SelectField control={control} name="category" options={optionsFrom(DocumentCategoryValues)} />
              </FormField>
            </FormGrid>
          </FormSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <FormSection
            title="Associations"
            description="Link this document to related records (all optional)."
          >
            <FormGrid>
              <FormField label="Property" error={errors.propertyId?.message}>
                <SelectField control={control} name="propertyId" options={[NONE, ...properties]} />
              </FormField>
              <FormField label="Tenant" error={errors.tenantId?.message}>
                <SelectField control={control} name="tenantId" options={[NONE, ...tenants]} />
              </FormField>
              <FormField label="Lease" error={errors.leaseId?.message}>
                <SelectField control={control} name="leaseId" options={[NONE, ...leases]} />
              </FormField>
              <FormField label="Owner" error={errors.ownerId?.message}>
                <SelectField control={control} name="ownerId" options={[NONE, ...owners]} />
              </FormField>
              <FormField label="Vendor" error={errors.vendorId?.message}>
                <SelectField control={control} name="vendorId" options={[NONE, ...vendors]} />
              </FormField>
            </FormGrid>
            <FormField label="Notes" error={errors.notes?.message}>
              <Textarea {...register("notes")} rows={3} placeholder="Optional notes…" />
            </FormField>
          </FormSection>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Save changes" : "Save document"}
        </Button>
      </div>
    </form>
  );
}
