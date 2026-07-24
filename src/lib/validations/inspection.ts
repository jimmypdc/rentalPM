import { z } from "zod";
import { InspectionTypeValues, ConditionRatingValues } from "@/lib/enums";

// Form schemas keep input === output (no .transform/.default/.coerce) so they
// type-check cleanly with react-hook-form's zodResolver. Date coercion happens
// in the server action.

export const inspectionSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  unitId: z.string().trim().optional(),
  tenantId: z.string().trim().optional(),
  type: z.enum(InspectionTypeValues),
  inspectionDate: z.string().min(1, "Inspection date is required"),
  inspector: z.string().trim().optional(),
  conditionRating: z.enum(ConditionRatingValues),
  notes: z.string().trim().optional(),
  issuesFound: z.string().trim().optional(),
  followUpRequired: z.boolean(),
  nextInspectionDate: z.string().trim().optional(),
});

export type InspectionInput = z.infer<typeof inspectionSchema>;
