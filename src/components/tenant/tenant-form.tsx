"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { tenantSchema, type TenantInput } from "@/lib/validations/tenant";
import { createTenant, updateTenant } from "@/server/tenants";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField, FormGrid, FormSection } from "@/components/shared/form-field";
import { SelectField } from "@/components/shared/rhf";
import { optionsFrom, TenantStatusValues } from "@/lib/enums";

export interface TenantFormValues extends Partial<TenantInput> {
  id?: string;
}

export function TenantForm({ initial }: { initial?: TenantFormValues }) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [pending, setPending] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TenantInput>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      firstName: initial?.firstName ?? "",
      lastName: initial?.lastName ?? "",
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
      dateOfBirth: initial?.dateOfBirth ?? "",
      emergencyName: initial?.emergencyName ?? "",
      emergencyPhone: initial?.emergencyPhone ?? "",
      employer: initial?.employer ?? "",
      monthlyIncome: initial?.monthlyIncome ?? "",
      vehicleInfo: initial?.vehicleInfo ?? "",
      pets: initial?.pets ?? "",
      notes: initial?.notes ?? "",
      status: initial?.status ?? "APPLICANT",
      moveInDate: initial?.moveInDate ?? "",
      moveOutDate: initial?.moveOutDate ?? "",
    },
  });

  async function onSubmit(values: TenantInput) {
    setPending(true);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.set(k, String(v));
    });
    const result = isEdit
      ? await updateTenant(initial!.id!, fd)
      : await createTenant(fd);
    if (result.ok) {
      toast.success(isEdit ? "Tenant updated" : "Tenant created");
      router.push(`/tenants/${result.data.id}`);
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
          <FormSection title="Personal">
            <FormGrid>
              <FormField label="First name" required error={errors.firstName?.message}>
                <Input {...register("firstName")} placeholder="Alex" />
              </FormField>
              <FormField label="Last name" required error={errors.lastName?.message}>
                <Input {...register("lastName")} placeholder="Rivera" />
              </FormField>
              <FormField label="Date of birth" error={errors.dateOfBirth?.message}>
                <Input type="date" {...register("dateOfBirth")} />
              </FormField>
              <FormField label="Status" required error={errors.status?.message}>
                <SelectField control={control} name="status" options={optionsFrom(TenantStatusValues)} />
              </FormField>
            </FormGrid>
          </FormSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <FormSection title="Contact">
            <FormGrid>
              <FormField label="Email" error={errors.email?.message}>
                <Input type="email" {...register("email")} placeholder="alex@example.com" />
              </FormField>
              <FormField label="Phone" error={errors.phone?.message}>
                <Input {...register("phone")} placeholder="(305) 555-0150" />
              </FormField>
            </FormGrid>
          </FormSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <FormSection title="Emergency contact">
            <FormGrid>
              <FormField label="Contact name" error={errors.emergencyName?.message}>
                <Input {...register("emergencyName")} />
              </FormField>
              <FormField label="Contact phone" error={errors.emergencyPhone?.message}>
                <Input {...register("emergencyPhone")} />
              </FormField>
            </FormGrid>
          </FormSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <FormSection title="Employment">
            <FormGrid>
              <FormField label="Employer" error={errors.employer?.message}>
                <Input {...register("employer")} />
              </FormField>
              <FormField label="Monthly income" error={errors.monthlyIncome?.message}>
                <Input type="number" step="0.01" {...register("monthlyIncome")} placeholder="5200.00" />
              </FormField>
            </FormGrid>
          </FormSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <FormSection title="Tenancy">
            <FormGrid>
              <FormField label="Move-in date" error={errors.moveInDate?.message}>
                <Input type="date" {...register("moveInDate")} />
              </FormField>
              <FormField label="Move-out date" error={errors.moveOutDate?.message}>
                <Input type="date" {...register("moveOutDate")} />
              </FormField>
            </FormGrid>
          </FormSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <FormSection title="Other">
            <FormGrid>
              <FormField label="Vehicle info" error={errors.vehicleInfo?.message}>
                <Input {...register("vehicleInfo")} placeholder="2021 Honda Civic — Plate ABC123" />
              </FormField>
              <FormField label="Pets" error={errors.pets?.message}>
                <Input {...register("pets")} placeholder="1 cat" />
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
          {isEdit ? "Save changes" : "Create tenant"}
        </Button>
      </div>
    </form>
  );
}
