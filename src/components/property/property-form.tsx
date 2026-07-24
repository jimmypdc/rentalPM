"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { propertySchema, type PropertyInput } from "@/lib/validations/property";
import { createProperty, updateProperty } from "@/server/properties";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField, FormGrid, FormSection } from "@/components/shared/form-field";
import { SelectField } from "@/components/shared/rhf";
import { optionsFrom, PropertyTypeValues, PropertyStatusValues } from "@/lib/enums";

export interface PropertyFormValues extends Partial<PropertyInput> {
  id?: string;
}

export function PropertyForm({ initial }: { initial?: PropertyFormValues }) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [pending, setPending] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PropertyInput>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: initial?.name ?? "",
      type: initial?.type ?? "SINGLE_FAMILY",
      status: initial?.status ?? "ACTIVE",
      street: initial?.street ?? "",
      city: initial?.city ?? "",
      state: initial?.state ?? "FL",
      zip: initial?.zip ?? "",
      county: initial?.county ?? "",
      purchaseDate: initial?.purchaseDate ?? "",
      purchasePrice: initial?.purchasePrice ?? "",
      estimatedValue: initial?.estimatedValue ?? "",
      propertyTaxAnnual: initial?.propertyTaxAnnual ?? "",
      insuranceAnnual: initial?.insuranceAnnual ?? "",
      hoaMonthly: initial?.hoaMonthly ?? "",
      squareFeet: initial?.squareFeet ?? "",
      yearBuilt: initial?.yearBuilt ?? "",
      bedrooms: initial?.bedrooms ?? "",
      bathrooms: initial?.bathrooms ?? "",
      ownerEntity: initial?.ownerEntity ?? "",
      notes: initial?.notes ?? "",
    },
  });

  async function onSubmit(values: PropertyInput) {
    setPending(true);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.set(k, String(v));
    });
    const result = isEdit
      ? await updateProperty(initial!.id!, fd)
      : await createProperty(fd);
    if (result.ok) {
      toast.success(isEdit ? "Property updated" : "Property created");
      router.push(`/properties/${result.data.id}`);
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
          <FormSection title="Basics">
            <FormGrid>
              <FormField label="Name" required error={errors.name?.message}>
                <Input {...register("name")} placeholder="Bayview Duplex" />
              </FormField>
              <FormField label="Type" required error={errors.type?.message}>
                <SelectField control={control} name="type" options={optionsFrom(PropertyTypeValues)} />
              </FormField>
              <FormField label="Status" required error={errors.status?.message}>
                <SelectField control={control} name="status" options={optionsFrom(PropertyStatusValues)} />
              </FormField>
            </FormGrid>
          </FormSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <FormSection title="Address">
            <FormGrid>
              <FormField label="Street" required error={errors.street?.message}>
                <Input {...register("street")} placeholder="123 Palm Ave" />
              </FormField>
              <FormField label="City" required error={errors.city?.message}>
                <Input {...register("city")} placeholder="Miami" />
              </FormField>
              <FormGrid cols={2}>
                <FormField label="State" error={errors.state?.message}>
                  <Input {...register("state")} maxLength={2} />
                </FormField>
                <FormField label="ZIP" required error={errors.zip?.message}>
                  <Input {...register("zip")} />
                </FormField>
              </FormGrid>
              <FormField label="County" error={errors.county?.message}>
                <Input {...register("county")} placeholder="Miami-Dade" />
              </FormField>
            </FormGrid>
          </FormSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <FormSection title="Details">
            <FormGrid>
              <FormField label="Square feet" error={errors.squareFeet?.message}>
                <Input type="number" {...register("squareFeet")} placeholder="1800" />
              </FormField>
              <FormField label="Year built" error={errors.yearBuilt?.message}>
                <Input type="number" {...register("yearBuilt")} placeholder="1998" />
              </FormField>
              <FormField label="Bedrooms" error={errors.bedrooms?.message}>
                <Input type="number" {...register("bedrooms")} placeholder="3" />
              </FormField>
              <FormField label="Bathrooms" error={errors.bathrooms?.message}>
                <Input type="number" step="0.5" {...register("bathrooms")} placeholder="2" />
              </FormField>
              <FormField label="Owner entity" error={errors.ownerEntity?.message}>
                <Input {...register("ownerEntity")} placeholder="Bayview Holdings LLC" />
              </FormField>
            </FormGrid>
          </FormSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <FormSection title="Financials">
            <FormGrid>
              <FormField label="Purchase date" error={errors.purchaseDate?.message}>
                <Input type="date" {...register("purchaseDate")} />
              </FormField>
              <FormField label="Purchase price" error={errors.purchasePrice?.message}>
                <Input type="number" step="0.01" {...register("purchasePrice")} placeholder="325000" />
              </FormField>
              <FormField label="Estimated value" error={errors.estimatedValue?.message}>
                <Input type="number" step="0.01" {...register("estimatedValue")} placeholder="410000" />
              </FormField>
              <FormField label="Property tax (annual)" error={errors.propertyTaxAnnual?.message}>
                <Input type="number" step="0.01" {...register("propertyTaxAnnual")} placeholder="5200" />
              </FormField>
              <FormField label="Insurance (annual)" error={errors.insuranceAnnual?.message}>
                <Input type="number" step="0.01" {...register("insuranceAnnual")} placeholder="2400" />
              </FormField>
              <FormField label="HOA (monthly)" error={errors.hoaMonthly?.message}>
                <Input type="number" step="0.01" {...register("hoaMonthly")} placeholder="0" />
              </FormField>
            </FormGrid>
          </FormSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <FormSection title="Notes">
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
          {isEdit ? "Save changes" : "Create property"}
        </Button>
      </div>
    </form>
  );
}
