import { z } from "zod";
import { PropertyTypeValues, PropertyStatusValues } from "@/lib/enums";

// Form schemas keep input === output (no .transform/.default/.coerce) so they
// type-check cleanly with react-hook-form's zodResolver. Numeric/date coercion
// happens in the server action.

export const propertySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  type: z.enum(PropertyTypeValues),
  status: z.enum(PropertyStatusValues),
  street: z.string().trim().min(1, "Street is required"),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().optional(),
  zip: z.string().trim().min(1, "ZIP is required"),
  county: z.string().trim().optional(),
  purchaseDate: z.string().trim().optional(),
  purchasePrice: z.string().trim().optional(),
  estimatedValue: z.string().trim().optional(),
  propertyTaxAnnual: z.string().trim().optional(),
  insuranceAnnual: z.string().trim().optional(),
  hoaMonthly: z.string().trim().optional(),
  squareFeet: z.string().trim().optional(),
  yearBuilt: z.string().trim().optional(),
  bedrooms: z.string().trim().optional(),
  bathrooms: z.string().trim().optional(),
  ownerEntity: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type PropertyInput = z.infer<typeof propertySchema>;
