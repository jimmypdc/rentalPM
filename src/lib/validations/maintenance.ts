import { z } from "zod";
import {
  MaintenanceCategoryValues,
  PriorityValues,
  MaintenanceStatusValues,
} from "@/lib/enums";

// Form schemas keep input === output (no .transform/.default/.coerce) so they
// type-check cleanly with react-hook-form's zodResolver. Numeric/date coercion
// happens in the server action.

export const maintenanceSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  unitId: z.string().trim().optional(),
  tenantId: z.string().trim().optional(),
  vendorId: z.string().trim().optional(),
  category: z.enum(MaintenanceCategoryValues),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  priority: z.enum(PriorityValues),
  status: z.enum(MaintenanceStatusValues),
  estimatedCost: z.string().trim().optional(),
  actualCost: z.string().trim().optional(),
  scheduledDate: z.string().trim().optional(),
  completedDate: z.string().trim().optional(),
  internalNotes: z.string().trim().optional(),
});

export type MaintenanceInput = z.infer<typeof maintenanceSchema>;
