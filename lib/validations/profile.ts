import { z } from "zod";
import { BloodType, Genotype } from "@prisma/client";

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),
  phone: z.string().trim().max(20).optional(),
  city: z.string().trim().max(60).optional(),
  bloodType: z.nativeEnum(BloodType).optional(),
});

export type ProfileValues = z.infer<typeof profileSchema>;

export const medicalHistorySchema = z.object({
  genotype: z.nativeEnum(Genotype).optional(),
  allergies: z.string().max(300).optional(),
  chronicConditions: z.string().max(300).optional(),
  medications: z.string().max(300).optional(),
  emergencyContactName: z.string().max(80).optional(),
  emergencyContactPhone: z.string().max(20).optional(),
});

export type MedicalHistoryValues = z.infer<typeof medicalHistorySchema>;
