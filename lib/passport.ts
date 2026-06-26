import type { PassportTier } from "@prisma/client";

const DAY_MS = 24 * 60 * 60 * 1000;
const QUARTER_MS = 90 * DAY_MS;

export function calculateTier(donationCount: number): PassportTier {
  if (donationCount >= 25) return "LEGEND";
  if (donationCount >= 5) return "VERIFIED";
  return "STARTER";
}

export function nextEligibleDate(lastDonated: Date): Date {
  return new Date(lastDonated.getTime() + QUARTER_MS);
}

export function daysLeftInQuarter(lastDonated: Date): number {
  const daysSince = (Date.now() - lastDonated.getTime()) / DAY_MS;
  return Math.max(Math.round(90 - daysSince), 0);
}

/**
 * A "quarter" is a rolling 90-day window. The streak counts consecutive
 * windows — walking back from now — that each contain at least one donation.
 */
export function calculateStreak(donations: { donatedAt: Date }[]): number {
  if (donations.length === 0) return 0;

  const sorted = [...donations].sort((a, b) => b.donatedAt.getTime() - a.donatedAt.getTime());
  const now = Date.now();

  const daysSinceLast = (now - sorted[0].donatedAt.getTime()) / DAY_MS;
  if (daysSinceLast > 90) return 0;

  let streak = 0;
  let windowEnd = now;

  while (true) {
    const windowStart = windowEnd - QUARTER_MS;
    const hasDonationInWindow = sorted.some((d) => {
      const t = d.donatedAt.getTime();
      return t > windowStart && t <= windowEnd;
    });
    if (!hasDonationInWindow) break;
    streak += 1;
    windowEnd = windowStart;
  }

  return streak;
}
