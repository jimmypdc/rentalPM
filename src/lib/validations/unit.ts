import { z } from "zod";
import { UnitStatusValues } from "@/lib/enums";

// Form schemas keep input === output (no .transform/.default/.coerce) so they
// type-check cleanly with react-hook-form's zodResolver. Numeric/date coercion
// happens in the server action.

export const unitSchema = z.object({
  propertyId: z.string().trim().min(1, "Property is required"),
  number: z.string().trim().min(1, "Unit number is required"),
  status: z.enum(UnitStatusValues),
  bedrooms: z.string().trim().optional(),
  bathrooms: z.string().trim().optional(),
  squareFeet: z.string().trim().optional(),
  marketRent: z.string().trim().optional(),
  currentRent: z.string().trim().optional(),
  depositAmount: z.string().trim().optional(),
  availableDate: z.string().trim().optional(),
  amenities: z.string().trim().optional(),
  parking: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type UnitInput = z.infer<typeof unitSchema>;
