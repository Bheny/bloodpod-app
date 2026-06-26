import { z } from "zod";
import { BloodType } from "@prisma/client";

export const donationSchema = z.object({
  facility: z.string().min(2, "Please enter the facility name"),
  donatedAt: z
    .string()
    .refine((date) => new Date(date) <= new Date(), "Cannot log a future donation"),
  bloodType: z.nativeEnum(BloodType),
  verified: z.boolean(),
  notes: z.string().max(120).optional(),
});

export type DonationValues = z.infer<typeof donationSchema>;
