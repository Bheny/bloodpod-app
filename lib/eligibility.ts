/** Donors must wait this long between donations (spec: 3-month window). */
export const ELIGIBILITY_MONTHS = 3;

export function computeEligibility(lastDonated: Date | null, now = new Date()) {
  if (!lastDonated) return { nextEligible: null, isEligible: true };
  const next = new Date(lastDonated);
  next.setMonth(next.getMonth() + ELIGIBILITY_MONTHS);
  return { nextEligible: next, isEligible: next <= now };
}

/** Whole days from now until a date, rounded up, never less than 1. */
export function daysUntil(date: Date | string): number {
  return Math.max(1, Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000));
}
