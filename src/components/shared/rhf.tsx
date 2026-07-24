"use client";

import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { SelectOption } from "@/types";

/** RHF-controlled Radix Select. */
export function SelectField<T extends FieldValues>({
  control,
  name,
  options,
  placeholder = "Select…",
  disabled,
}: {
  control: Control<T>;
  name: Path<T>;
  options: readonly SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select
          value={field.value ?? ""}
          onValueChange={field.onChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}

/** RHF-controlled checkbox with inline label. */
export function CheckboxField<T extends FieldValues>({
  control,
  name,
  label,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={!!field.value}
            onCheckedChange={(v) => field.onChange(!!v)}
          />
          {label}
        </label>
      )}
    />
  );
}
