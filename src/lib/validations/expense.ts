import { z } from "zod";
import { ExpenseCategoryValues, PaymentMethodValues } from "@/lib/enums";

// Form schemas keep input === output (no .transform/.default/.coerce) so they
// type-check cleanly with react-hook-form's zodResolver. Numeric/date coercion
// happens in the server action via toNum/toDate.

export const expenseSchema = z.object({
  date: z.string().trim().min(1, "Date is required"),
  propertyId: z.string().trim().min(1, "Property is required"),
  unitId: z.string().trim().optional(),
  vendorId: z.string().trim().optional(),
  category: z.enum(ExpenseCategoryValues),
  description: z.string().trim().optional(),
  amount: z.string().trim().min(1, "Amount is required"),
  method: z.enum(PaymentMethodValues),
  taxDeductible: z.boolean(),
  isRecurring: z.boolean(),
  notes: z.string().trim().optional(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
