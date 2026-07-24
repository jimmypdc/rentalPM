"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { inspectionSchema, type InspectionInput } from "@/lib/validations/inspection";
import { createInspection, updateInspection } from "@/server/inspections";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField, FormGrid, FormSection } from "@/components/shared/form-field";
import { SelectField, CheckboxField } from "@/components/shared/rhf";
import { optionsFrom, InspectionTypeValues, ConditionRatingValues } from "@/lib/enums";
import type { SelectOption } from "@/types";
import type { UnitOption } from "@/components/maintenance/maintenance-form";

export interface InspectionFormValues extends Partial<InspectionInput> {
  id?: string;
}

export function InspectionForm({
  properties,
  units,
  tenants,
  initial,
}: {
  properties: SelectOption[];
  units: UnitOption[];
  tenants: SelectOption[];
  initial?: InspectionFormValues;
}) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [pending, setPending] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<InspectionInput>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      propertyId: initial?.propertyId ?? "",
      unitId: initial?.unitId ?? "",
      tenantId: initial?.tenantId ?? "",
      type: initial?.type ?? "ROUTINE",
      inspectionDate: initial?.inspectionDate ?? "",
      inspector: initial?.inspector ?? "",
      conditionRating: initial?.conditionRating ?? "GOOD",
      notes: initial?.notes ?? "",
      issuesFound: initial?.issuesFound ?? "",
      followUpRequired: initial?.followUpRequired ?? false,
      nextInspectionDate: initial?.nextInspectionDate ?? "",
    },
  });

  const selectedProperty = watch("propertyId");
  const unitOptions = units.filter((u) => u.propertyId === selectedProperty);

  async function onSubmit(values: InspectionInput) {
    setPending(true);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.set(k, String(v));
    });
    const result = isEdit
      ? await updateInspection(initial!.id!, fd)
      : await createInspection(fd);
    if (result.ok) {
      toast.success(isEdit ? "Inspection updated" : "Inspection created");
      router.push(`/inspections/${result.data.id}`);
      router.refresh();
    } else {
      toast.error(result.error);
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <FormSection title="Inspection">
            <FormGrid>
              <FormField label="Property" required error={errors.propertyId?.message}>
                <SelectField control={control} name="propertyId" options={properties} placeholder="Select property…" />
              </FormField>
              <FormField label="Unit" error={errors.unitId?.message}>
                <SelectField
                  control={control}
                  name="unitId"
                  options={unitOptions}
                  placeholder={selectedProperty ? "Select unit…" : "Select a property first"}
                  disabled={!selectedProperty}
                />
              </FormField>
              <FormField label="Tenant" error={errors.tenantId?.message}>
                <SelectField control={control} name="tenantId" options={tenants} placeholder="No tenant" />
              </FormField>
              <FormField label="Type" required error={errors.type?.message}>
                <SelectField control={control} name="type" options={optionsFrom(InspectionTypeValues)} />
              </FormField>
              <FormField label="Inspection date" required error={errors.inspectionDate?.message}>
                <Input type="date" {...register("inspectionDate")} />
              </FormField>
              <FormField label="Inspector" error={errors.inspector?.message}>
                <Input {...register("inspector")} placeholder="Jane Manager" />
              </FormField>
              <FormField label="Overall condition" required error={errors.conditionRating?.message}>
                <SelectField control={control} name="conditionRating" options={optionsFrom(ConditionRatingValues)} />
              </FormField>
              <FormField label="Next inspection" error={errors.nextInspectionDate?.message}>
                <Input type="date" {...register("nextInspectionDate")} />
              </FormField>
            </FormGrid>
            <FormField label="Follow-up">
              <div className="pt-2">
                <CheckboxField control={control} name="followUpRequired" label="Follow-up required" />
              </div>
            </FormField>
          </FormSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <FormSection title="Findings">
            <FormField label="Issues found" error={errors.issuesFound?.message}>
              <Textarea {...register("issuesFound")} rows={3} placeholder="Note any damage or issues…" />
            </FormField>
            <FormField label="Notes" error={errors.notes?.message}>
              <Textarea {...register("notes")} rows={3} />
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
          {isEdit ? "Save changes" : "Create inspection"}
        </Button>
      </div>
    </form>
  );
}
