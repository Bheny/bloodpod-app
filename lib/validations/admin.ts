import { z } from "zod";
import { parseGhsToPesewas } from "@/lib/admin/format";

const amount = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const p = parseGhsToPesewas(v);
    if (p === null || p <= 0) {
      ctx.addIssue({ code: "custom", message: "Enter an amount like 1500 or 1,250.50" });
      return z.NEVER;
    }
    if (p > 2_000_000_000) {
      ctx.addIssue({ code: "custom", message: "That amount is too large" });
      return z.NEVER;
    }
    return p;
  });

const isoDate = z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date");

export const ledgerEntrySchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  status: z.enum(["PAID", "PENDING"]),
  category: z.string().trim().min(2).max(60),
  description: z.string().trim().max(200).optional(),
  amount,
  date: isoDate,
  invoiceNo: z.string().trim().max(40).optional(),
  hospitalId: z.string().trim().optional(),
});

export const ledgerPatchSchema = z.object({ status: z.enum(["PAID", "PENDING"]) });

export const contractSchema = z.object({
  hospitalId: z.string().trim().min(1, "Choose a hospital"),
  monthly: amount,
  startsAt: isoDate,
  notes: z.string().trim().max(300).optional(),
});

export const contractPatchSchema = z.object({ status: z.enum(["ACTIVE", "PAUSED", "ENDED"]) });

export const openingBalanceSchema = z.object({
  amount: z
    .string()
    .trim()
    .transform((v, ctx) => {
      const p = parseGhsToPesewas(v === "" ? "0" : v);
      if (p === null) {
        ctx.addIssue({ code: "custom", message: "Enter an amount like 5000" });
        return z.NEVER;
      }
      return p;
    }),
});

export const hospitalReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "PENDING"]),
  note: z.string().trim().max(500).optional(),
});

// ---- Services page labs ----------------------------------------------------------

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

const optionalCoord = (min: number, max: number) =>
  z
    .union([z.number(), z.string().trim()])
    .optional()
    .transform((v, ctx) => {
      if (v === undefined || v === "") return null;
      const n = typeof v === "number" ? v : Number(v);
      if (!Number.isFinite(n) || n < min || n > max) {
        ctx.addIssue({ code: "custom", message: "Enter a valid map coordinate" });
        return z.NEVER;
      }
      return n;
    });

export const labSchema = z.object({
  name: z.string().trim().min(2, "Enter the lab's name").max(120),
  town: z.string().trim().min(2, "Choose a town").max(80),
  address: optionalText(200),
  phone: optionalText(40),
  // Left empty, the pin falls back to the town centre.
  latitude: optionalCoord(3, 12.5),
  longitude: optionalCoord(-4.8, 2.8),
  active: z.boolean().optional(),
  tests: z
    .array(
      z.object({
        id: z.enum(["blood-group", "genotype", "hep-hiv", "haemoglobin"]),
        price: z
          .string()
          .trim()
          .optional()
          .transform((v, ctx) => {
            if (!v) return null;
            const p = parseGhsToPesewas(v);
            if (p === null) {
              ctx.addIssue({ code: "custom", message: "Enter a price like 50 or 45.50" });
              return z.NEVER;
            }
            return p;
          }),
      }),
    )
    .min(1, "Pick at least one test"),
});

export const labActiveSchema = z.object({ active: z.boolean() });
