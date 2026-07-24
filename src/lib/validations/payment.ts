import { z } from "zod";
import { PaymentMethodValues } from "@/lib/enums";

// Form schema keeps input === output (no .transform/.default/.coerce). Numbers
// and dates stay as strings in the form and are coerced in the server action.

export const paymentSchema = z.object({
  tenantId: z.string().trim().min(1, "Tenant is required"),
  amount: z.string().trim().min(1, "Amount is required"),
  receivedOn: z.string().trim().min(1, "Received date is required"),
  method: z.enum(PaymentMethodValues),
  chargeId: z.string().trim().optional(),
  reference: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
