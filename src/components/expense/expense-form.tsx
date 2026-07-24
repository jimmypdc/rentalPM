"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { expenseSchema, type ExpenseInput } from "@/lib/validations/expense";
import { createExpense, updateExpense } from "@/server/expenses";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField, FormGrid, FormSection } from "@/components/shared/form-field";
import { SelectField, CheckboxField } from "@/components/shared/rhf";
import { optionsFrom, ExpenseCategoryValues, PaymentMethodValues } from "@/lib/enums";
import type { SelectOption } from "@/types";

export interface ExpenseFormValues extends Partial<ExpenseInput> {
  id?: string;
}

export interface UnitOption extends SelectOption {
  propertyId: string;
}

export interface ExpenseFormProps {
  properties: SelectOption[];
  vendors: SelectOption[];
  units: UnitOption[];
  initial?: ExpenseFormValues;
}

const NONE = "__none__";

export function ExpenseForm({ properties, vendors, units, initial }: ExpenseFormProps) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [pending, setPending] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: initial?.date ?? new Date().toISOString().slice(0, 10),
      propertyId: initial?.propertyId ?? "",
      unitId: initial?.unitId ?? "",
      vendorId: initial?.vendorId ?? "",
      category: initial?.category ?? "REPAIRS",
      description: initial?.description ?? "",
      amount: initial?.amount ?? "",
      method: initial?.method ?? "ACH",
      taxDeductible: initial?.taxDeductible ?? true,
      isRecurring: initial?.isRecurring ?? false,
      notes: initial?.notes ?? "",
    },
  });

  const selectedProperty = useWatch({ control, name: "propertyId" });
  const unitOptions = React.useMemo(
    () =>
      [{ value: NONE, label: "No specific unit" }].concat(
        units
          .filter((u) => u.propertyId === selectedProperty)
          .map((u) => ({ value: u.value, label: u.label })),
      ),
    [units, selectedProperty],
  );
  const vendorOptions = React.useMemo(
    () => [{ value: NONE, label: "No vendor" }, ...vendors],
    [vendors],
  );

  async function onSubmit(values: ExpenseInput) {
    setPending(true);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if ((k === "unitId" || k === "vendorId") && (v === NONE || v === "")) return;
      fd.set(k, String(v));
    });
    const result = isEdit
      ? await updateExpense(initial!.id!, fd)
      : await createExpense(fd);
    if (result.ok) {
      toast.success(isEdit ? "Expense updated" : "Expense logged");
      router.push("/expenses");
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
          <FormSection title="Expense details">
            <FormGrid>
              <FormField label="Date" required error={errors.date?.message}>
                <Input type="date" {...register("date")} />
              </FormField>
              <FormField label="Amount" required error={errors.amount?.message}>
                <Input type="number" step="0.01" {...register("amount")} placeholder="250.00" />
              </FormField>
              <FormField label="Property" required error={errors.propertyId?.message}>
                <SelectField
                  control={control}
                  name="propertyId"
                  options={properties}
                  placeholder="Select property"
                />
              </FormField>
              <FormField label="Unit" error={errors.unitId?.message}>
                <SelectField
                  control={control}
                  name="unitId"
                  options={unitOptions}
                  placeholder="No specific unit"
                  disabled={!selectedProperty}
                />
              </FormField>
              <FormField label="Category" required error={errors.category?.message}>
                <SelectField
                  control={control}
                  name="category"
                  options={optionsFrom(ExpenseCategoryValues)}
                />
              </FormField>
              <FormField label="Vendor" error={errors.vendorId?.message}>
                <SelectField
                  control={control}
                  name="vendorId"
                  options={vendorOptions}
                  placeholder="No vendor"
                />
              </FormField>
              <FormField label="Payment method" required error={errors.method?.message}>
                <SelectField
                  control={control}
                  name="method"
                  options={optionsFrom(PaymentMethodValues)}
                />
              </FormField>
            </FormGrid>
            <FormField label="Description" error={errors.description?.message}>
              <Input {...register("description")} placeholder="e.g. Water heater replacement" />
            </FormField>
          </FormSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <FormSection title="Classification">
            <FormGrid>
              <FormField label="Tax">
                <div className="pt-2">
                  <CheckboxField
                    control={control}
                    name="taxDeductible"
                    label="Tax deductible"
                  />
                </div>
              </FormField>
              <FormField label="Recurring">
                <div className="pt-2">
                  <CheckboxField
                    control={control}
                    name="isRecurring"
                    label="Recurring expense"
                  />
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
          {isEdit ? "Save changes" : "Log expense"}
        </Button>
      </div>
    </form>
  );
}
