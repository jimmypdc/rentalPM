"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { leaseSchema, type LeaseInput } from "@/lib/validations/lease";
import { createLease, updateLease } from "@/server/leases";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField, FormGrid, FormSection } from "@/components/shared/form-field";
import { SelectField } from "@/components/shared/rhf";
import { optionsFrom, LeaseStatusValues, RenewalStatusValues } from "@/lib/enums";
import type { SelectOption } from "@/types";

export interface LeaseFormValues extends Partial<LeaseInput> {
  id?: string;
}

export function LeaseForm({
  units,
  tenants,
  initial,
}: {
  units: SelectOption[];
  tenants: SelectOption[];
  initial?: LeaseFormValues;
}) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [pending, setPending] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LeaseInput>({
    resolver: zodResolver(leaseSchema),
    defaultValues: {
      propertyId: initial?.propertyId ?? "",
      unitId: initial?.unitId ?? "",
      tenantId: initial?.tenantId ?? "",
      startDate: initial?.startDate ?? "",
      endDate: initial?.endDate ?? "",
      rent: initial?.rent ?? "",
      securityDeposit: initial?.securityDeposit ?? "",
      petDeposit: initial?.petDeposit ?? "",
      otherDeposit: initial?.otherDeposit ?? "",
      lateFee: initial?.lateFee ?? "",
      gracePeriodDays: initial?.gracePeriodDays ?? "5",
      rentDueDay: initial?.rentDueDay ?? "1",
      status: initial?.status ?? "DRAFT",
      renewalStatus: initial?.renewalStatus ?? "NONE",
      moveInDate: initial?.moveInDate ?? "",
      moveOutDate: initial?.moveOutDate ?? "",
      notes: initial?.notes ?? "",
    },
  });

  async function onSubmit(values: LeaseInput) {
    setPending(true);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.set(k, String(v));
    });
    const result = isEdit
      ? await updateLease(initial!.id!, fd)
      : await createLease(fd);
    if (result.ok) {
      toast.success(isEdit ? "Lease updated" : "Lease created");
      router.push(`/leases/${result.data.id}`);
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
          <FormSection title="Unit & tenant">
            <FormGrid>
              <FormField label="Unit" required error={errors.unitId?.message}>
                <SelectField control={control} name="unitId" options={units} placeholder="Select unit…" />
              </FormField>
              <FormField label="Tenant" required error={errors.tenantId?.message}>
                <SelectField control={control} name="tenantId" options={tenants} placeholder="Select tenant…" />
              </FormField>
            </FormGrid>
          </FormSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <FormSection title="Term & rent">
            <FormGrid>
              <FormField label="Start date" required error={errors.startDate?.message}>
                <Input type="date" {...register("startDate")} />
              </FormField>
              <FormField label="End date" required error={errors.endDate?.message}>
                <Input type="date" {...register("endDate")} />
              </FormField>
              <FormField label="Monthly rent" required error={errors.rent?.message}>
                <Input type="number" step="0.01" {...register("rent")} placeholder="2000.00" />
              </FormField>
              <FormField label="Rent due day" error={errors.rentDueDay?.message} hint="Day of month rent is due">
                <Input type="number" min={1} max={31} {...register("rentDueDay")} />
              </FormField>
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
          <FormSection title="Deposits & fees">
            <FormGrid>
              <FormField label="Security deposit" error={errors.securityDeposit?.message}>
                <Input type="number" step="0.01" {...register("securityDeposit")} />
              </FormField>
              <FormField label="Pet deposit" error={errors.petDeposit?.message}>
                <Input type="number" step="0.01" {...register("petDeposit")} />
              </FormField>
              <FormField label="Other deposit" error={errors.otherDeposit?.message}>
                <Input type="number" step="0.01" {...register("otherDeposit")} />
              </FormField>
              <FormField label="Late fee" error={errors.lateFee?.message}>
                <Input type="number" step="0.01" {...register("lateFee")} />
              </FormField>
              <FormField label="Grace period (days)" error={errors.gracePeriodDays?.message}>
                <Input type="number" min={0} {...register("gracePeriodDays")} />
              </FormField>
            </FormGrid>
          </FormSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <FormSection title="Status">
            <FormGrid>
              <FormField label="Lease status" required error={errors.status?.message}>
                <SelectField control={control} name="status" options={optionsFrom(LeaseStatusValues)} />
              </FormField>
              <FormField label="Renewal status" required error={errors.renewalStatus?.message}>
                <SelectField control={control} name="renewalStatus" options={optionsFrom(RenewalStatusValues)} />
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
          {isEdit ? "Save changes" : "Create lease"}
        </Button>
      </div>
    </form>
  );
}
