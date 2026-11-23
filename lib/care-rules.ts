import type { BloodType, ConditionType, ConditionVisibility, RotaStatus } from "@prisma/client";
import { canDonateTo } from "@/lib/blood-compatibility";

/**
 * Care Pod rules as plain functions, so they can be tested without a database.
 * Nothing here looks at a plan: who is eligible, who is asked and who is reminded never depends
 * on what anyone pays. A plan only decides who may use the family's dashboard, and that check lives elsewhere.
 */

const DAY = 86_400_000;

export const CARE_RULES = {
  /** Donors are reminded this many days before a date. */
  donorReminderDays: [3, 1] as const,
  /** The family is warned this many days before if the rota is short. */
  familyReminderDays: 7,
  /** Existing limit: non-critical notifications per donor per day. */
  nonCriticalPerDay: 3,
  /** A donor who has not answered by the date no longer counts. */
  maxDonorsNeeded: 10,
  /** Dates further out than this are rejected as a typo. */
  maxDaysAhead: 400,
  intervalMinDays: 7,
  intervalMaxDays: 180,
} as const;

export interface DonorLike {
  bloodType: BloodType | null;
  nextEligible: Date | null;
}

/** Whole days from `now` until `date`, rounded up. Negative once the date has passed. */
export function daysUntilDate(date: Date, now: Date = new Date()): number {
  return Math.ceil((date.getTime() - now.getTime()) / DAY);
}

/**
 * Can this donor give on the transfusion date? Their blood must be safe for the patient, and the
 * 3-month rule must be over by the day, not just today. Someone who donated last week can still
 * be asked for a date two months away.
 */
export function eligibleOnDate(donor: DonorLike, patientBlood: BloodType, date: Date): boolean {
  if (!donor.bloodType || !canDonateTo(donor.bloodType, patientBlood)) return false;
  return !donor.nextEligible || donor.nextEligible.getTime() <= date.getTime();
}

/** Days after the date until the donor could give, or 0 if they can on the day. */
export function daysUntilEligible(donor: DonorLike, date: Date): number {
  if (!donor.nextEligible || donor.nextEligible.getTime() <= date.getTime()) return 0;
  return Math.ceil((donor.nextEligible.getTime() - date.getTime()) / DAY);
}

export interface RotaCounts {
  /** Everyone asked. */
  asked: number;
  yes: number;
  /** Asked and not answered yet. Declines are not shown to the family as such. */
  waiting: number;
}

/**
 * The family sees counts until a donor says Yes. A "No" is folded into "asked" so nobody feels
 * singled out for declining; only a Yes becomes a name.
 */
export function rotaCounts(entries: readonly { status: RotaStatus }[]): RotaCounts {
  let yes = 0;
  let waiting = 0;
  for (const e of entries) {
    if (e.status === "YES") yes++;
    else if (e.status === "REQUESTED") waiting++;
  }
  return { asked: entries.length, yes, waiting };
}

export function rotaState(yes: number, needed: number): "full" | "short" | "empty" {
  if (yes >= needed) return "full";
  return yes === 0 ? "empty" : "short";
}

export type DonorReminder = "3d" | "1d";

/**
 * Which reminder, if any, is due for a donor who said Yes. The 1-day reminder wins when both
 * windows are open (a missed cron run), and each is sent once.
 */
export function donorReminderDue(
  now: Date,
  scheduledFor: Date,
  sent: { remind3dSentAt: Date | null; remind1dSentAt: Date | null },
): DonorReminder | null {
  const left = daysUntilDate(scheduledFor, now);
  if (left < 0) return null;
  if (left <= 1 && !sent.remind1dSentAt) return "1d";
  if (left <= 3 && left > 1 && !sent.remind3dSentAt) return "3d";
  return null;
}

/** The family is told once, 7 days out, when the rota has fewer Yes answers than donors needed. */
export function familyReminderDue(
  now: Date,
  d: { scheduledFor: Date; donorsNeeded: number; completedAt: Date | null; familyReminderSentAt: Date | null },
  yesCount: number,
): boolean {
  if (d.completedAt || d.familyReminderSentAt) return false;
  const left = daysUntilDate(d.scheduledFor, now);
  return left >= 0 && left <= CARE_RULES.familyReminderDays && yesCount < d.donorsNeeded;
}

/** Existing limit: at most 3 non-critical notifications per donor per day. */
export function canNotify(nonCriticalLast24h: number): boolean {
  return nonCriticalLast24h < CARE_RULES.nonCriticalPerDay;
}

/** A family cannot ask the whole Pod at once: at most three times the donors needed, never over 12. */
export function askLimit(donorsNeeded: number): number {
  return Math.min(12, donorsNeeded * 3);
}

export function nextDateAfter(date: Date, intervalDays: number): Date {
  return new Date(date.getTime() + intervalDays * DAY);
}

export function validDateRange(date: Date, now: Date = new Date()): boolean {
  const left = daysUntilDate(date, now);
  return left >= 0 && left <= CARE_RULES.maxDaysAhead;
}

/** The only fields a donor ever sees about a transfusion request. */
export interface DonorAskView {
  bloodType: BloodType;
  scheduledFor: Date;
  hospital: string | null;
  donorsNeeded: number;
  /** First name of the Pod owner who is asking. Pod members already know each other. */
  askedBy: string | null;
}

export function donorAskView(p: {
  bloodType: BloodType;
  scheduledFor: Date;
  donorsNeeded: number;
  hospitalName: string | null;
  organisationName: string | null;
  ownerName: string | null;
}): DonorAskView {
  return {
    bloodType: p.bloodType,
    scheduledFor: p.scheduledFor,
    hospital: p.organisationName ?? p.hospitalName,
    donorsNeeded: p.donorsNeeded,
    askedBy: p.ownerName?.trim().split(/\s+/)[0] || null,
  };
}

/** Condition type is health data: the owner, or anyone only if the owner explicitly shared it. */
export function canSeeCondition(
  viewerId: string,
  p: { ownerId: string; conditionVisibility: ConditionVisibility },
): boolean {
  return viewerId === p.ownerId || p.conditionVisibility === "SHARED";
}

export const CONDITION_LABELS: Record<ConditionType, string> = {
  SICKLE_CELL: "Sickle cell",
  THALASSEMIA: "Thalassemia",
  DIALYSIS: "Dialysis",
  CANCER: "Cancer",
  OTHER: "Other",
};
