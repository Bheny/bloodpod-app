import { formatPesewas, PLUS_YEARLY, PRICING } from "@/lib/pricing";
import { FREE_OWNED_POD_LIMIT, FREE_POD_MEMBER_LIMIT, PAID_OWNED_POD_LIMIT } from "@/lib/pod-limits";

/**
 * What each plan says about itself, in one place for the landing page and /upgrade.
 * Prices come from lib/pricing.ts. Which tools a plan really unlocks is lib/entitlements.ts:
 * this file only words it. A line marked `soon` is promised but not built yet, and the screens say so.
 */

export interface PlanLine {
  text: string;
  /** Not built yet. Shown with a "Soon" tag so no one pays for something that is not there. */
  soon?: boolean;
}

/** Basic is retired from the screens (Plus now holds its tools); the name stays for old interest rows. */
export type TierId = "FREE" | "PLUS";
export type PackageId = "CARE" | "CASE";

export interface Tier {
  id: TierId;
  name: string;
  audience: string;
  price: string;
  cadence: string;
  lines: PlanLine[];
  /** The same plan billed once a year, when it is offered. */
  yearly?: YearlyOffer;
}

export interface YearlyOffer {
  price: string;
  cadence: string;
  /** What it works out to each month, for comparing with the monthly price. */
  perMonth: string;
  /** "2 months free", or "Save GH₵50" when it does not come out in whole months. */
  saving: string;
  /** The twelve monthly payments added up, for crossing out. */
  monthlyTotal: string;
}

export interface Package {
  id: PackageId;
  name: string;
  audience: string;
  price: string;
  cadence: string;
  lines: PlanLine[];
}

/** Said on every screen that shows a price. It is the product's one promise. */
export const PLAN_PROMISE =
  "Emergency alerts are always free. A paid plan never changes who is alerted, in what order, or whether you can join a Pod or send an alert.";

function yearlyOffer(monthly: number, yearly: number): YearlyOffer {
  const saved = monthly * 12 - yearly;
  const months = saved / monthly;
  return {
    price: formatPesewas(yearly),
    cadence: "a year",
    perMonth: formatPesewas(Math.round(yearly / 12)),
    saving: Number.isInteger(months) && months >= 1 ? `${months} month${months === 1 ? "" : "s"} free` : `Save ${formatPesewas(Math.max(0, saved))}`,
    monthlyTotal: formatPesewas(monthly * 12),
  };
}

export const TIERS: Tier[] = [
  {
    id: "FREE",
    name: "Free",
    audience: "For everyone",
    price: "GH₵0",
    cadence: "always",
    lines: [
      { text: `A Pod of up to ${FREE_POD_MEMBER_LIMIT} people you trust, and up to ${FREE_OWNED_POD_LIMIT} Pods of your own` },
      { text: "Send and receive emergency alerts" },
      { text: "Be listed as a donor, join any Pod and ask donors in Discover" },
      { text: "Your own Blood Card, working offline, and your donation log" },
      { text: "Practice drills to check your Pod would answer" },
      { text: "Save up to 3 lab results by hand", soon: true },
    ],
  },
  {
    id: "PLUS",
    name: "Plus",
    audience: "For your health records, and your family's",
    price: formatPesewas(PRICING.PLUS.pesewas),
    cadence: "a month",
    yearly: yearlyOffer(PRICING.PLUS.pesewas, PLUS_YEARLY.pesewas),
    lines: [
      { text: `Own up to ${PAID_OWNED_POD_LIMIT} Pods` },
      { text: "A result vault with no limit", soon: true },
      { text: "Snap a result and we read the values for you", soon: true },
      { text: "Trends over time, and retest reminders", soon: true },
      { text: "A doctor-ready PDF of your results", soon: true },
      { text: "Family profiles for up to 4 people", soon: true },
      { text: "Member prices on lab check bundles, where the lab agrees", soon: true },
    ],
  },
];

export interface CompareRow {
  feature: string;
  free: string;
  plus: string;
  /** Not built yet: the row is shown with a "Soon" tag. */
  soon?: boolean;
}

/**
 * Free next to Plus, feature by feature. "Yes" and "No" draw as a tick and a dash; anything else is shown as written.
 * Only rows that work today leave out `soon`.
 */
export const COMPARISON: CompareRow[] = [
  { feature: "Blood type card and eligibility check", free: "Yes", plus: "Yes" },
  { feature: "Donation history and next donation date", free: "Yes", plus: "Yes" },
  { feature: "Medical ID on the lock screen", free: "Yes", plus: "Yes", soon: true },
  { feature: "Donation reminders and calendar sync", free: "Yes", plus: "Yes", soon: true },
  { feature: "Digital donation certificate", free: "Yes", plus: "Yes", soon: true },
  { feature: "Result vault, saved by hand", free: "Up to 3 results", plus: "Unlimited", soon: true },
  { feature: "Snap your result: photo to extracted values", free: "No", plus: "Yes", soon: true },
  { feature: "Trends and retest reminders", free: "No", plus: "Yes", soon: true },
  { feature: "Doctor-ready PDF export", free: "No", plus: "Yes", soon: true },
  { feature: "Family profiles", free: "No", plus: "Up to 4", soon: true },
  { feature: "Annual report, “your year of giving”", free: "Basic", plus: "Full", soon: true },
  { feature: "Member prices on check bundles", free: "Prices shown", plus: "Where the lab agrees", soon: true },
];

export const PACKAGES: Package[] = [
  {
    id: "CARE",
    name: "Care Pod",
    audience: "For one patient who needs blood again and again, like sickle cell or dialysis",
    price: formatPesewas(PRICING.CARE.pesewas),
    cadence: "a month, per patient",
    lines: [
      { text: "A dashboard for the next transfusion date" },
      { text: "A donor rota: ask eligible Pod members once per date" },
      { text: "Reminders to donors, and to your family if the rota is short" },
      { text: "A Family Blood Card and Medical ID for the patient", soon: true },
    ],
  },
  {
    id: "CASE",
    name: "Case Pod",
    audience: "For one planned surgery or delivery",
    price: formatPesewas(PRICING.CASE.pesewas),
    cadence: `once, for ${PRICING.CASE.durationDays} days`,
    lines: [
      { text: "The same tools as a Care Pod, around one date" },
      { text: `Runs for ${PRICING.CASE.durationDays} days, then stays readable as a record` },
    ],
  },
];

export const PLAN_NAMES: Record<TierId | PackageId | "BASIC", string> = {
  FREE: "the Free plan",
  BASIC: "the Basic plan",
  PLUS: "the Plus plan",
  CARE: "the Care Pod",
  CASE: "the Case Pod",
};
