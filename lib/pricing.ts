import type { SubscriptionPlan } from "@prisma/client";

/**
 * Prices and Paystack plan codes live here and nowhere else.
 * Money is integer pesewas (1 GH₵ = 100 pesewas), never floats.
 */
function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export const CURRENCY = "GHS";

export const PRICING = {
  CARE: {
    pesewas: intFromEnv("CARE_POD_PRICE_PESEWAS", 3000), // GH₵30 / month
    interval: "monthly" as const,
    paystackPlanCode: process.env.PAYSTACK_CARE_PLAN_CODE ?? null,
  },
  CASE: {
    pesewas: intFromEnv("CASE_POD_PRICE_PESEWAS", 12000), // GH₵120 one-off
    interval: "one-off" as const,
    durationDays: 90,
  },
} as const;

export type PaidPlan = Exclude<SubscriptionPlan, "FREE">;

export function priceFor(plan: PaidPlan): number {
  return PRICING[plan].pesewas;
}

/** "GH₵30" or "GH₵30.50". Integer pesewas in, display string out. */
export function formatPesewas(pesewas: number): string {
  const cedis = pesewas / 100;
  return `GH₵${Number.isInteger(cedis) ? cedis : cedis.toFixed(2)}`;
}
