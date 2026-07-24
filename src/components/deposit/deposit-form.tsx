"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { depositSchema, type DepositInput } from "@/lib/validations/deposit";
import { createDeposit, updateDeposit } from "@/server/deposits";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField, FormGrid, FormSection } from "@/components/shared/form-field";
import { SelectField } from "@/components/shared/rhf";
import { optionsFrom, DepositStatusValues } from "@/lib/enums";
import type { SelectOption } from "@/types";

export interface DepositFormValues extends Partial<DepositInput> {
  id?: string;
}

export function DepositForm({
  leases,
  tenants,
  initial,
}: {
  leases: SelectOption[];
  tenants: SelectOption[];
  initial?: DepositFormValues;
}) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [pending, setPending] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<DepositInput>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      leaseId: initial?.leaseId ?? "",
      tenantId: initial?.tenantId ?? "",
      amount: initial?.amount ?? "",
      receivedOn: initial?.receivedOn ?? "",
      account: initial?.account ?? "",
      interest: initial?.interest ?? "",
      deductions: initial?.deductions ?? "",
      refundAmount: initial?.refundAmount ?? "",
      refundedOn: initial?.refundedOn ?? "",
      status: initial?.status ?? "HELD",
      notes: initial?.notes ?? "",
    },
  });

  async function onSubmit(values: DepositInput) {
    setPending(true);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.set(k, String(v));
    });
    const result = isEdit
      ? await updateDeposit(initial!.id!, fd)
      : await createDeposit(fd);
    if (result.ok) {
      toast.success(isEdit ? "Deposit updated" : "Deposit recorded");
      router.push("/deposits");
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
          <FormSection title="Deposit details">
            <FormGrid>
              <FormField label="Lease" required error={errors.leaseId?.message}>
                <SelectField control={control} name="leaseId" options={leases} placeholder="Select lease…" />
              </FormField>
              <FormField label="Tenant" error={errors.tenantId?.message}>
                <SelectField control={control} name="tenantId" options={tenants} placeholder="Select tenant…" />
              </FormField>
              <FormField label="Amount" required error={errors.amount?.message}>
                <Input type="number" step="0.01" {...register("amount")} placeholder="2000.00" />
              </FormField>
              <FormField label="Received on" error={errors.receivedOn?.message}>
                <Input type="date" {...register("receivedOn")} />
              </FormField>
              <FormField label="Holding account" error={errors.account?.message}>
                <Input {...register("account")} placeholder="Trust account" />
              </FormField>
              <FormField label="Status" required error={errors.status?.message}>
                <SelectField control={control} name="status" options={optionsFrom(DepositStatusValues)} />
              </FormField>
            </FormGrid>
          </FormSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <FormSection title="Interest & refund">
            <FormGrid>
              <FormField label="Interest accrued" error={errors.interest?.message}>
                <Input type="number" step="0.01" {...register("interest")} />
              </FormField>
              <FormField label="Deductions" error={errors.deductions?.message}>
                <Input type="number" step="0.01" {...register("deductions")} />
              </FormField>
              <FormField label="Refund amount" error={errors.refundAmount?.message}>
                <Input type="number" step="0.01" {...register("refundAmount")} />
              </FormField>
              <FormField label="Refunded on" error={errors.refundedOn?.message}>
                <Input type="date" {...register("refundedOn")} />
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
          {isEdit ? "Save changes" : "Record deposit"}
        </Button>
      </div>
    </form>
  );
}
