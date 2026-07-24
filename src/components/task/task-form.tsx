"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { taskSchema, type TaskInput } from "@/lib/validations/task";
import { createTask, updateTask } from "@/server/tasks";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormField, FormGrid, FormSection } from "@/components/shared/form-field";
import { SelectField } from "@/components/shared/rhf";
import {
  optionsFrom,
  PriorityValues,
  TaskStatusValues,
  TaskCategoryValues,
} from "@/lib/enums";
import type { SelectOption } from "@/types";

export interface TaskFormValues extends Partial<TaskInput> {
  id?: string;
}

export function TaskForm({
  properties,
  tenants,
  vendors,
  initial,
}: {
  properties: SelectOption[];
  tenants: SelectOption[];
  vendors: SelectOption[];
  initial?: TaskFormValues;
}) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [pending, setPending] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      propertyId: initial?.propertyId ?? "",
      tenantId: initial?.tenantId ?? "",
      vendorId: initial?.vendorId ?? "",
      dueDate: initial?.dueDate ?? "",
      priority: initial?.priority ?? "NORMAL",
      status: initial?.status ?? "TODO",
      category: initial?.category ?? "GENERAL",
      reminderAt: initial?.reminderAt ?? "",
      notes: initial?.notes ?? "",
    },
  });

  async function onSubmit(values: TaskInput) {
    setPending(true);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.set(k, String(v));
    });
    const result = isEdit ? await updateTask(initial!.id!, fd) : await createTask(fd);
    if (result.ok) {
      toast.success(isEdit ? "Task updated" : "Task created");
      router.push("/tasks");
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
          <FormSection title="Task">
            <FormField label="Title" required error={errors.title?.message}>
              <Input {...register("title")} placeholder="Renew landlord insurance" />
            </FormField>
            <FormField label="Description" error={errors.description?.message}>
              <Textarea {...register("description")} rows={3} />
            </FormField>
            <FormGrid>
              <FormField label="Category" required error={errors.category?.message}>
                <SelectField control={control} name="category" options={optionsFrom(TaskCategoryValues)} />
              </FormField>
              <FormField label="Priority" required error={errors.priority?.message}>
                <SelectField control={control} name="priority" options={optionsFrom(PriorityValues)} />
              </FormField>
              <FormField label="Status" required error={errors.status?.message}>
                <SelectField control={control} name="status" options={optionsFrom(TaskStatusValues)} />
              </FormField>
              <FormField label="Due date" error={errors.dueDate?.message}>
                <Input type="date" {...register("dueDate")} />
              </FormField>
              <FormField label="Reminder" error={errors.reminderAt?.message}>
                <Input type="datetime-local" {...register("reminderAt")} />
              </FormField>
            </FormGrid>
          </FormSection>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <FormSection title="Links">
            <FormGrid>
              <FormField label="Property" error={errors.propertyId?.message}>
                <SelectField control={control} name="propertyId" options={properties} placeholder="No property" />
              </FormField>
              <FormField label="Tenant" error={errors.tenantId?.message}>
                <SelectField control={control} name="tenantId" options={tenants} placeholder="No tenant" />
              </FormField>
              <FormField label="Vendor" error={errors.vendorId?.message}>
                <SelectField control={control} name="vendorId" options={vendors} placeholder="No vendor" />
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
          {isEdit ? "Save changes" : "Create task"}
        </Button>
      </div>
    </form>
  );
}
