import { z } from "zod";
import { DepositStatusValues } from "@/lib/enums";

// Form schema keeps input === output (no .transform/.default/.coerce). Numbers
// and dates stay as strings in the form and are coerced in the server action.

export const depositSchema = z.object({
  leaseId: z.string().trim().min(1, "Lease is required"),
  tenantId: z.string().trim().optional(),
  amount: z.string().trim().min(1, "Amount is required"),
  receivedOn: z.string().trim().optional(),
  account: z.string().trim().optional(),
  interest: z.string().trim().optional(),
  deductions: z.string().trim().optional(),
  refundAmount: z.string().trim().optional(),
  refundedOn: z.string().trim().optional(),
  status: z.enum(DepositStatusValues),
  notes: z.string().trim().optional(),
});

export type DepositInput = z.infer<typeof depositSchema>;
