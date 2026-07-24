"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { paymentSchema, type PaymentInput } from "@/lib/validations/payment";
import { recordPayment } from "@/server/payments";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField, FormGrid, FormSection } from "@/components/shared/form-field";
import { SelectField } from "@/components/shared/rhf";
import { optionsFrom, PaymentMethodValues } from "@/lib/enums";
import type { SelectOption } from "@/types";
import type { OpenChargeOption } from "@/server/finance";

export function PaymentForm({
  tenants,
  openCharges,
}: {
  tenants: SelectOption[];
  openCharges: OpenChargeOption[];
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      tenantId: "",
      amount: "",
      receivedOn: new Date().toISOString().slice(0, 10),
      method: "ACH",
      chargeId: "",
      reference: "",
      notes: "",
    },
  });

  const tenantId = useWatch({ control, name: "tenantId" });
  const chargeOptions: SelectOption[] = React.useMemo(
    () =>
      openCharges
        .filter((c) => c.tenantId === tenantId)
        .map((c) => ({ value: c.id, label: c.label })),
    [openCharges, tenantId],
  );

  // Reset the selected charge whenever the tenant changes.
  React.useEffect(() => {
    setValue("chargeId", "");
  }, [tenantId, setValue]);

  async function onSubmit(values: PaymentInput) {
    setPending(true);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.set(k, String(v));
    });
    const result = await recordPayment(fd);
    if (result.ok) {
      toast.success("Payment recorded");
      router.push("/payments");
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
          <FormSection title="Payment details">
            <FormGrid>
              <FormField label="Tenant" required error={errors.tenantId?.message}>
                <SelectField control={control} name="tenantId" options={tenants} placeholder="Select tenant…" />
              </FormField>
              <FormField
                label="Apply to charge"
                error={errors.chargeId?.message}
                hint={
                  tenantId
                    ? chargeOptions.length
                      ? "Optional — leave blank to leave unapplied"
                      : "No open charges for this tenant"
                    : "Choose a tenant first"
                }
              >
                <SelectField
                  control={control}
                  name="chargeId"
                  options={chargeOptions}
                  placeholder="Unapplied"
                  disabled={!tenantId || chargeOptions.length === 0}
                />
              </FormField>
              <FormField label="Amount" required error={errors.amount?.message}>
                <Input type="number" step="0.01" {...register("amount")} placeholder="2000.00" />
              </FormField>
              <FormField label="Received on" required error={errors.receivedOn?.message}>
                <Input type="date" {...register("receivedOn")} />
              </FormField>
              <FormField label="Method" required error={errors.method?.message}>
                <SelectField control={control} name="method" options={optionsFrom(PaymentMethodValues)} />
              </FormField>
              <FormField label="Reference" error={errors.reference?.message} hint="Check #, confirmation, etc.">
                <Input {...register("reference")} />
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
          Record payment
        </Button>
      </div>
    </form>
  );
}
