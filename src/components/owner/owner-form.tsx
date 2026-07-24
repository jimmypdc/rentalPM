"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ownerSchema, type OwnerInput } from "@/lib/validations/owner";
import { createOwner, updateOwner } from "@/server/owners";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField, FormGrid, FormSection } from "@/components/shared/form-field";
import { SelectField, CheckboxField } from "@/components/shared/rhf";
import { optionsFrom, ContactMethodValues } from "@/lib/enums";

export interface OwnerFormValues extends Partial<OwnerInput> {
  id?: string;
}

export function OwnerForm({ initial }: { initial?: OwnerFormValues }) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [pending, setPending] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<OwnerInput>({
    resolver: zodResolver(ownerSchema),
    defaultValues: {
      firstName: initial?.firstName ?? "",
      lastName: initial?.lastName ?? "",
      company: initial?.company ?? "",
      email: initial?.email ?? "",
      phone: initial?.phone ?? "",
      street: initial?.street ?? "",
      city: initial?.city ?? "",
      state: initial?.state ?? "FL",
      zip: initial?.zip ?? "",
      contactMethod: initial?.contactMethod ?? "EMAIL",
      isSelf: initial?.isSelf ?? false,
      taxId: initial?.taxId ?? "",
      paymentInfo: initial?.paymentInfo ?? "",
      managementFeePercent: initial?.managementFeePercent ?? "",
      notes: initial?.notes ?? "",
    },
  });

  async function onSubmit(values: OwnerInput) {
    setPending(true);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.set(k, String(v));
    });
    const result = isEdit
      ? await updateOwner(initial!.id!, fd)
      : await createOwner(fd);
    if (result.ok) {
      toast.success(isEdit ? "Owner updated" : "Owner created");
      router.push(`/owners/${result.data.id}`);
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
          <FormSection title="Name">
            <FormGrid>
              <FormField label="First name" required error={errors.firstName?.message}>
                <Input {...register("firstName")} placeholder="Jane" />
              </FormField>
              <FormField label="Last name" required error={errors.lastName?.message}>
                <Input {...register("lastName")} placeholder="Doe" />
              </FormField>
              <FormField label="Company" error={errors.company?.message}>
                <Input {...register("company")} placeholder="Doe Holdings LLC" />
              </FormField>
              <FormField label="This is me">
                <div className="pt-2">
                  <CheckboxField control={control} name="isSelf" label="This owner is me (self-managed)" />
                </div>
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
                <Input type="email" {...register("email")} placeholder="jane@example.com" />
              </FormField>
              <FormField label="Phone" error={errors.phone?.message}>
                <Input {...register("phone")} placeholder="(305) 555-0101" />
              </FormField>
              <FormField label="Preferred contact method" error={errors.contactMethod?.message}>
                <SelectField control={control} name="contactMethod" options={optionsFrom(ContactMethodValues)} />
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
          <FormSection title="Business">
            <FormGrid>
              <FormField
                label="Management fee %"
                hint="Percent of rental income charged as a management fee."
                error={errors.managementFeePercent?.message}
              >
                <Input type="number" step="0.01" {...register("managementFeePercent")} placeholder="8.00" />
              </FormField>
              <FormField label="Tax ID" hint="Stored as a placeholder." error={errors.taxId?.message}>
                <Input {...register("taxId")} placeholder="••-•••••••" />
              </FormField>
              <FormField label="Payment info" hint="Stored as a placeholder." error={errors.paymentInfo?.message}>
                <Input {...register("paymentInfo")} placeholder="ACH — Bank ••1234" />
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
          {isEdit ? "Save changes" : "Create owner"}
        </Button>
      </div>
    </form>
  );
}
