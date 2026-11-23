import { z } from "zod";
import { BloodType, ConditionType, ConditionVisibility } from "@prisma/client";
import { CARE_RULES } from "@/lib/care-rules";

const dateString = z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date");

export const createCareSchema = z.object({
  displayName: z.string().trim().min(2, "Enter the patient's name or nickname").max(60),
  conditionType: z.nativeEnum(ConditionType),
  conditionVisibility: z.nativeEnum(ConditionVisibility).default("PRIVATE"),
  bloodType: z.nativeEnum(BloodType),
  hospitalName: z.string().trim().max(120).optional(),
  transfusionIntervalDays: z.number().int().min(CARE_RULES.intervalMinDays).max(CARE_RULES.intervalMaxDays).nullable().optional(),
  nextTransfusionAt: dateString,
  donorsNeeded: z.number().int().min(1).max(CARE_RULES.maxDonorsNeeded),
  podId: z.string().min(1).max(64).nullable().optional(),
  // The family must tick the consent line before health details are stored.
  consent: z.literal(true, { message: "Please confirm you have permission to share these details" }),
});

export const addDateSchema = z.object({
  scheduledFor: dateString,
  donorsNeeded: z.number().int().min(1).max(CARE_RULES.maxDonorsNeeded).optional(),
});

export const askSchema = z.object({
  donorIds: z.array(z.string().min(1).max(64)).min(1).max(12),
});

export const answerSchema = z.object({ answer: z.enum(["yes", "no"]) });
