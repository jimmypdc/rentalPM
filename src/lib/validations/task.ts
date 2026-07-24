import { z } from "zod";
import {
  PriorityValues,
  TaskStatusValues,
  TaskCategoryValues,
} from "@/lib/enums";

// Form schemas keep input === output (no .transform/.default/.coerce) so they
// type-check cleanly with react-hook-form's zodResolver. Date coercion happens
// in the server action.

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  propertyId: z.string().trim().optional(),
  tenantId: z.string().trim().optional(),
  vendorId: z.string().trim().optional(),
  dueDate: z.string().trim().optional(),
  priority: z.enum(PriorityValues),
  status: z.enum(TaskStatusValues),
  category: z.enum(TaskCategoryValues),
  reminderAt: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type TaskInput = z.infer<typeof taskSchema>;
