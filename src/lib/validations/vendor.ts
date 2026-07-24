import { z } from "zod";
import { VendorCategoryValues, WNineStatusValues } from "@/lib/enums";

// Form schemas keep input === output (no .transform/.default/.coerce) so they
// type-check cleanly with react-hook-form's zodResolver. Numeric/date coercion
// happens in the server action.

export const vendorSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required"),
  contactName: z.string().trim().optional(),
  category: z.enum(VendorCategoryValues),
  email: z.union([z.literal(""), z.string().email("Invalid email")]).optional(),
  phone: z.string().trim().optional(),
  street: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  zip: z.string().trim().optional(),
  website: z.string().trim().optional(),
  licenseNumber: z.string().trim().optional(),
  insuranceExpiration: z.string().trim().optional(),
  wNineStatus: z.enum(WNineStatusValues),
  preferred: z.boolean(),
  hourlyRate: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type VendorInput = z.infer<typeof vendorSchema>;
