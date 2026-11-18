import { z } from "zod";
import { normalizeGhanaPhone } from "@/lib/phone";

// Each part is optional: the step only asks for what the account is missing.
export const detailsSchema = z.object({
  phone: z
    .string()
    .trim()
    .refine((v) => normalizeGhanaPhone(v) !== null, "Enter a Ghana mobile number, like 024 123 4567")
    .optional(),
  neverDonated: z.boolean().optional(),
  lastDonated: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Enter a valid date"),
});

export type DetailsValues = z.infer<typeof detailsSchema>;
