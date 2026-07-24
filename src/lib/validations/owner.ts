import { z } from "zod";
import { ContactMethodValues } from "@/lib/enums";

// Form schemas keep input === output (no .transform/.default/.coerce) so they
// type-check cleanly with react-hook-form's zodResolver. Numeric/date coercion
// happens in the server action.

export const ownerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  company: z.string().trim().optional(),
  email: z.union([z.literal(""), z.string().email("Invalid email")]).optional(),
  phone: z.string().trim().optional(),
  street: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  zip: z.string().trim().optional(),
  contactMethod: z.enum(ContactMethodValues),
  isSelf: z.boolean(),
  taxId: z.string().trim().optional(),
  paymentInfo: z.string().trim().optional(),
  managementFeePercent: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type OwnerInput = z.infer<typeof ownerSchema>;
