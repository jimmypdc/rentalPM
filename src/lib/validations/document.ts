import { z } from "zod";
import { DocumentCategoryValues } from "@/lib/enums";

// Form schemas keep input === output (no .transform/.default/.coerce) so they
// type-check cleanly with react-hook-form's zodResolver. Associations are stored
// as ids (or empty string for "none"); the server action normalizes them.

export const documentSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  category: z.enum(DocumentCategoryValues),
  propertyId: z.string().trim().optional(),
  tenantId: z.string().trim().optional(),
  leaseId: z.string().trim().optional(),
  ownerId: z.string().trim().optional(),
  vendorId: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type DocumentInput = z.infer<typeof documentSchema>;
