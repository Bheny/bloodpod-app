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
  BASIC: {
    pesewas: intFromEnv("BASIC_PLAN_PRICE_PESEWAS", 1000), // GH₵10 / month (to test: see PlanInterest first)
    interval: "monthly" as const,
    paystackPlanCode: process.env.PAYSTACK_BASIC_PLAN_CODE ?? null,
  },
  PLUS: {
    pesewas: intFromEnv("PLUS_PLAN_PRICE_PESEWAS", 2500), // GH₵25 / month
    interval: "monthly" as const,
    paystackPlanCode: process.env.PAYSTACK_PLUS_PLAN_CODE ?? null,
  },
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

/**
 * Plus billed once a year. Two months free against twelve monthly payments, unless set otherwise.
 * Display only for now: checkout for Plus is not open yet.
 */
export const PLUS_YEARLY = {
  pesewas: intFromEnv("PLUS_PLAN_YEARLY_PRICE_PESEWAS", PRICING.PLUS.pesewas * 10),
  interval: "yearly" as const,
  paystackPlanCode: process.env.PAYSTACK_PLUS_YEARLY_PLAN_CODE ?? null,
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
