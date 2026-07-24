"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { vendorSchema, type VendorInput } from "@/lib/validations/vendor";
import { createVendor, updateVendor } from "@/server/vendors";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField, FormGrid, FormSection } from "@/components/shared/form-field";
import { SelectField, CheckboxField } from "@/components/shared/rhf";
import { optionsFrom, VendorCategoryValues, WNineStatusValues } from "@/lib/enums";

export interface VendorFormValues extends Partial<VendorInput> {
  id?: string;
}

export function VendorForm({ initial }: { initial?: VendorFormValues }) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [pending, setPending] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<VendorInput>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      companyName: initial?.companyName ?? "",
      contactName: initial?.contactName ?? "",
      category: initial?.category ?? "OTHER",
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
      street: initial?.street ?? "",
      city: initial?.city ?? "",
      state: initial?.state ?? "FL",
      zip: initial?.zip ?? "",
      website: initial?.website ?? "",
      licenseNumber: initial?.licenseNumber ?? "",
      insuranceExpiration: initial?.insuranceExpiration ?? "",
      wNineStatus: initial?.wNineStatus ?? "NOT_REQUESTED",
      preferred: initial?.preferred ?? false,
      hourlyRate: initial?.hourlyRate ?? "",
      notes: initial?.notes ?? "",
    },
  });

  async function onSubmit(values: VendorInput) {
    setPending(true);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.set(k, String(v));
    });
    const result = isEdit
      ? await updateVendor(initial!.id!, fd)
      : await createVendor(fd);
    if (result.ok) {
      toast.success(isEdit ? "Vendor updated" : "Vendor created");
      router.push(`/vendors/${result.data.id}`);
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
          <FormSection title="Company details">
            <FormGrid>
              <FormField label="Company name" required error={errors.companyName?.message}>
                <Input {...register("companyName")} placeholder="Sunshine Plumbing Co." />
              </FormField>
              <FormField label="Contact name" error={errors.contactName?.message}>
                <Input {...register("contactName")} placeholder="Rick Waters" />
              </FormField>
              <FormField label="Category" required error={errors.category?.message}>
                <SelectField control={control} name="category" options={optionsFrom(VendorCategoryValues)} />
              </FormField>
              <FormField label="Hourly rate" error={errors.hourlyRate?.message}>
                <Input type="number" step="0.01" {...register("hourlyRate")} placeholder="95.00" />
              </FormField>
            </FormGrid>
          </FormSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <FormSection title="Contact & address">
            <FormGrid>
              <FormField label="Email" error={errors.email?.message}>
                <Input type="email" {...register("email")} placeholder="rick@example.com" />
              </FormField>
              <FormField label="Phone" error={errors.phone?.message}>
                <Input {...register("phone")} placeholder="(305) 555-0201" />
              </FormField>
              <FormField label="Website" error={errors.website?.message}>
                <Input {...register("website")} placeholder="https://…" />
              </FormField>
              <FormField label="Street" error={errors.street?.message}>
                <Input {...register("street")} />
              </FormField>
              <FormField label="City" error={errors.city?.message}>
                <Input {...register("city")} />
              </FormField>
              <FormGrid cols={2}>
                <FormField label="State" error={errors.state?.message}>
                  <Input {...register("state")} maxLength={2} />
                </FormField>
                <FormField label="ZIP" error={errors.zip?.message}>
                  <Input {...register("zip")} />
                </FormField>
              </FormGrid>
            </FormGrid>
          </FormSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <FormSection title="Compliance">
            <FormGrid>
              <FormField label="License number" error={errors.licenseNumber?.message}>
                <Input {...register("licenseNumber")} />
              </FormField>
              <FormField label="Insurance expiration" error={errors.insuranceExpiration?.message}>
                <Input type="date" {...register("insuranceExpiration")} />
              </FormField>
              <FormField label="W-9 status" error={errors.wNineStatus?.message}>
                <SelectField control={control} name="wNineStatus" options={optionsFrom(WNineStatusValues)} />
              </FormField>
              <FormField label="Preferred vendor">
                <div className="pt-2">
                  <CheckboxField control={control} name="preferred" label="Mark as preferred vendor" />
                </div>
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
          {isEdit ? "Save changes" : "Create vendor"}
        </Button>
      </div>
    </form>
  );
}
