import { z } from "zod";
import { TenantStatusValues } from "@/lib/enums";

// Form schemas keep input === output (no .transform/.default/.coerce) so they
// type-check cleanly with react-hook-form's zodResolver. Numeric/date coercion
// happens in the server action.

export const tenantSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.union([z.literal(""), z.string().email("Invalid email")]).optional(),
  phone: z.string().trim().optional(),
  dateOfBirth: z.string().trim().optional(),
  emergencyName: z.string().trim().optional(),
  emergencyPhone: z.string().trim().optional(),
  employer: z.string().trim().optional(),
  monthlyIncome: z.string().trim().optional(),
  vehicleInfo: z.string().trim().optional(),
  pets: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  status: z.enum(TenantStatusValues),
  moveInDate: z.string().trim().optional(),
  moveOutDate: z.string().trim().optional(),
});

export type TenantInput = z.infer<typeof tenantSchema>;
