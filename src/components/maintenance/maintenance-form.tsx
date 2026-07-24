"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { maintenanceSchema, type MaintenanceInput } from "@/lib/validations/maintenance";
import { createMaintenance, updateMaintenance } from "@/server/maintenance";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField, FormGrid, FormSection } from "@/components/shared/form-field";
import { SelectField } from "@/components/shared/rhf";
import {
  optionsFrom,
  MaintenanceCategoryValues,
  PriorityValues,
  MaintenanceStatusValues,
} from "@/lib/enums";
import type { SelectOption } from "@/types";

export interface UnitOption extends SelectOption {
  propertyId: string;
}

export interface MaintenanceFormValues extends Partial<MaintenanceInput> {
  id?: string;
}

export function MaintenanceForm({
  properties,
  units,
  tenants,
  vendors,
  initial,
}: {
  properties: SelectOption[];
  units: UnitOption[];
  tenants: SelectOption[];
  vendors: SelectOption[];
  initial?: MaintenanceFormValues;
}) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [pending, setPending] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MaintenanceInput>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      propertyId: initial?.propertyId ?? "",
      unitId: initial?.unitId ?? "",
      tenantId: initial?.tenantId ?? "",
      vendorId: initial?.vendorId ?? "",
      category: initial?.category ?? "GENERAL_REPAIR",
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      priority: initial?.priority ?? "NORMAL",
      status: initial?.status ?? "NEW",
      estimatedCost: initial?.estimatedCost ?? "",
      actualCost: initial?.actualCost ?? "",
      scheduledDate: initial?.scheduledDate ?? "",
      completedDate: initial?.completedDate ?? "",
      internalNotes: initial?.internalNotes ?? "",
    },
  });

  const selectedProperty = useWatch({ control, name: "propertyId" });
  const unitOptions = units.filter((u) => u.propertyId === selectedProperty);

  async function onSubmit(values: MaintenanceInput) {
    setPending(true);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.set(k, String(v));
    });
    const result = isEdit
      ? await updateMaintenance(initial!.id!, fd)
      : await createMaintenance(fd);
    if (result.ok) {
      toast.success(isEdit ? "Request updated" : "Request created");
      router.push(`/maintenance/${result.data.id}`);
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
          <FormSection title="Request">
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
              <FormField label="Category" required error={errors.category?.message}>
                <SelectField control={control} name="category" options={optionsFrom(MaintenanceCategoryValues)} />
              </FormField>
              <FormField label="Priority" required error={errors.priority?.message}>
                <SelectField control={control} name="priority" options={optionsFrom(PriorityValues)} />
              </FormField>
            </FormGrid>
            <FormField label="Title" required error={errors.title?.message}>
              <Input {...register("title")} placeholder="Leaking kitchen faucet" />
            </FormField>
            <FormField label="Description" error={errors.description?.message}>
              <Textarea {...register("description")} rows={3} placeholder="Describe the issue…" />
            </FormField>
          </FormSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <FormSection title="Assignment & status">
            <FormGrid>
              <FormField label="Tenant" error={errors.tenantId?.message}>
                <SelectField control={control} name="tenantId" options={tenants} placeholder="No tenant" />
              </FormField>
              <FormField label="Vendor" error={errors.vendorId?.message}>
                <SelectField control={control} name="vendorId" options={vendors} placeholder="Unassigned" />
              </FormField>
              <FormField label="Status" required error={errors.status?.message}>
                <SelectField control={control} name="status" options={optionsFrom(MaintenanceStatusValues)} />
              </FormField>
            </FormGrid>
          </FormSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <FormSection title="Costs & scheduling">
            <FormGrid>
              <FormField label="Estimated cost" error={errors.estimatedCost?.message}>
                <Input type="number" step="0.01" {...register("estimatedCost")} placeholder="150.00" />
              </FormField>
              <FormField label="Actual cost" error={errors.actualCost?.message}>
                <Input type="number" step="0.01" {...register("actualCost")} placeholder="0.00" />
              </FormField>
              <FormField label="Scheduled date" error={errors.scheduledDate?.message}>
                <Input type="date" {...register("scheduledDate")} />
              </FormField>
              <FormField label="Completed date" error={errors.completedDate?.message}>
                <Input type="date" {...register("completedDate")} />
              </FormField>
            </FormGrid>
            <FormField label="Internal notes" error={errors.internalNotes?.message}>
              <Textarea {...register("internalNotes")} rows={3} />
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
          {isEdit ? "Save changes" : "Create request"}
        </Button>
      </div>
    </form>
  );
}
