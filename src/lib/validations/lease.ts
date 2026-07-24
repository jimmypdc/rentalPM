import { z } from "zod";
import { LeaseStatusValues, RenewalStatusValues } from "@/lib/enums";

// Form schema keeps input === output (no .transform/.default/.coerce). Numbers
// and dates stay as strings in the form and are coerced in the server action.

export const leaseSchema = z.object({
  propertyId: z.string().trim().optional(),
  unitId: z.string().trim().min(1, "Unit is required"),
  tenantId: z.string().trim().min(1, "Tenant is required"),
  startDate: z.string().trim().min(1, "Start date is required"),
  endDate: z.string().trim().min(1, "End date is required"),
  rent: z.string().trim().min(1, "Rent is required"),
  securityDeposit: z.string().trim().optional(),
  petDeposit: z.string().trim().optional(),
  otherDeposit: z.string().trim().optional(),
  lateFee: z.string().trim().optional(),
  gracePeriodDays: z.string().trim().optional(),
  rentDueDay: z.string().trim().optional(),
  status: z.enum(LeaseStatusValues),
  renewalStatus: z.enum(RenewalStatusValues),
  moveInDate: z.string().trim().optional(),
  moveOutDate: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type LeaseInput = z.infer<typeof leaseSchema>;
