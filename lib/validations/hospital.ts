import { z } from "zod";
import { normalizeGhanaAnyNumber } from "@/lib/phone";

export const hospitalKindOptions = [
  { value: "HOSPITAL", label: "Hospital", hint: "Inpatient and emergency care" },
  { value: "BLOOD_BANK", label: "Blood bank", hint: "Collects and stores blood" },
  { value: "CLINIC", label: "Clinic", hint: "Outpatient or specialist" },
] as const;

// Step 1: the person applying.
export const hospitalContactSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),
  jobTitle: z.string().trim().min(2, "Enter your role, like Head of Blood Bank").max(80),
  email: z.string().trim().email("Enter your work email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Step 2: the facility.
export const hospitalFacilitySchema = z.object({
  facilityName: z.string().trim().min(3, "Enter the facility's full name").max(120),
  kind: z.enum(["HOSPITAL", "BLOOD_BANK", "CLINIC"]),
  city: z.string().trim().min(2, "Enter the city or town").max(60),
  address: z.string().trim().min(5, "Enter the street address or area").max(200),
  facilityPhone: z
    .string()
    .trim()
    .refine((v) => normalizeGhanaAnyNumber(v) !== null, "Enter a Ghana number we can call, like 030 123 4567 or 024 123 4567"),
  note: z.string().trim().max(500).optional(),
});

export const hospitalApplicationSchema = hospitalContactSchema.merge(hospitalFacilitySchema);
export type HospitalApplicationValues = z.infer<typeof hospitalApplicationSchema>;
