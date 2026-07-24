"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { unitSchema, type UnitInput } from "@/lib/validations/unit";
import { createUnit, updateUnit } from "@/server/units";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField, FormGrid, FormSection } from "@/components/shared/form-field";
import { SelectField } from "@/components/shared/rhf";
import { optionsFrom, UnitStatusValues } from "@/lib/enums";
import type { SelectOption } from "@/types";

export interface UnitFormValues extends Partial<UnitInput> {
  id?: string;
}

export function UnitForm({
  initial,
  properties,
}: {
  initial?: UnitFormValues;
  properties: SelectOption[];
}) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [pending, setPending] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UnitInput>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      propertyId: initial?.propertyId ?? properties[0]?.value ?? "",
      number: initial?.number ?? "",
      status: initial?.status ?? "VACANT",
      bedrooms: initial?.bedrooms ?? "",
      bathrooms: initial?.bathrooms ?? "",
      squareFeet: initial?.squareFeet ?? "",
      marketRent: initial?.marketRent ?? "",
      currentRent: initial?.currentRent ?? "",
      depositAmount: initial?.depositAmount ?? "",
      availableDate: initial?.availableDate ?? "",
      amenities: initial?.amenities ?? "",
      parking: initial?.parking ?? "",
      notes: initial?.notes ?? "",
    },
  });

  async function onSubmit(values: UnitInput) {
    setPending(true);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.set(k, String(v));
    });
    const result = isEdit
      ? await updateUnit(initial!.id!, fd)
      : await createUnit(fd);
    if (result.ok) {
      toast.success(isEdit ? "Unit updated" : "Unit created");
      router.push("/units");
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
          <FormSection title="Unit details">
            <FormGrid>
              <FormField label="Property" required error={errors.propertyId?.message}>
                <SelectField control={control} name="propertyId" options={properties} placeholder="Select property…" />
              </FormField>
              <FormField label="Unit number" required error={errors.number?.message}>
                <Input {...register("number")} placeholder="A / 101" />
              </FormField>
              <FormField label="Status" required error={errors.status?.message}>
                <SelectField control={control} name="status" options={optionsFrom(UnitStatusValues)} />
              </FormField>
              <FormField label="Bedrooms" error={errors.bedrooms?.message}>
                <Input type="number" {...register("bedrooms")} placeholder="2" />
              </FormField>
              <FormField label="Bathrooms" error={errors.bathrooms?.message}>
                <Input type="number" step="0.5" {...register("bathrooms")} placeholder="1" />
              </FormField>
              <FormField label="Square feet" error={errors.squareFeet?.message}>
                <Input type="number" {...register("squareFeet")} placeholder="900" />
              </FormField>
            </FormGrid>
          </FormSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <FormSection title="Rent & availability">
            <FormGrid>
              <FormField label="Market rent" error={errors.marketRent?.message}>
                <Input type="number" step="0.01" {...register("marketRent")} placeholder="1800" />
              </FormField>
              <FormField label="Current rent" error={errors.currentRent?.message}>
                <Input type="number" step="0.01" {...register("currentRent")} placeholder="1750" />
              </FormField>
              <FormField label="Deposit amount" error={errors.depositAmount?.message}>
                <Input type="number" step="0.01" {...register("depositAmount")} placeholder="1800" />
              </FormField>
              <FormField label="Available date" error={errors.availableDate?.message}>
                <Input type="date" {...register("availableDate")} />
              </FormField>
              <FormField label="Parking" error={errors.parking?.message}>
                <Input {...register("parking")} placeholder="1 assigned space" />
              </FormField>
              <FormField label="Amenities" error={errors.amenities?.message}>
                <Input {...register("amenities")} placeholder="W/D, dishwasher" />
              </FormField>
            </FormGrid>
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
          {isEdit ? "Save changes" : "Create unit"}
        </Button>
      </div>
    </form>
  );
}
