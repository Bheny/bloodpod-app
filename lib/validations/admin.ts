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
