import { BloodType, type RequestUrgency } from "@prisma/client";
import { canDonateTo } from "@/lib/blood-compatibility";
import { haversineDistanceKm } from "@/lib/geo";

/**
 * The alert system's rules, in one place and with no database: who is asked, when the ask widens,
 * and what each person may see. Change a number here and nowhere else.
 *
 * The shape: a request goes to the requester's Pod at once. If nobody says yes in time, it widens to
 * matching donors nearby who chose to be listed. Nobody is paid, and nobody is shown anything they do not need.
 */
export const ALERT = {
  /** How long a request stays open. */
  expiresHours: { CRITICAL: 6, URGENT: 24, STANDARD: 72 } as Record<RequestUrgency, number>,
  /** Minutes with no yes before the ask widens to donors nearby. */
  widenAfterMinutes: { CRITICAL: 5, URGENT: 15, STANDARD: 60 } as Record<RequestUrgency, number>,
  /** Widening stops once this many people have said they are coming. */
  enoughYes: 2,
  nearbyKm: 25,
  nearbyMax: 30,
  /** Real requests one person may raise in a day, and at once. */
  perDay: 3,
  openAtOnce: 1,
  facilityMax: 120,
  locationMax: 120,
  messageMax: 280,
} as const;

const MIN = 60_000;
const HOUR = 3_600_000;

export const expiryFor = (urgency: RequestUrgency, now = new Date()) => new Date(now.getTime() + ALERT.expiresHours[urgency] * HOUR);
export const widenAtFor = (urgency: RequestUrgency, now = new Date()) => new Date(now.getTime() + ALERT.widenAfterMinutes[urgency] * MIN);

/** Every blood type that can safely give to a person who needs `needed`. */
export function donorTypesFor(needed: BloodType): BloodType[] {
  return (Object.values(BloodType) as BloodType[]).filter((t) => canDonateTo(t, needed));
}

export type AlertStatus = "OPEN" | "FULFILLED" | "CANCELLED" | "EXPIRED" | "MATCHED";

/** OPEN until it is closed or its time runs out. The stored status can lag behind the clock, so read it through this. */
export function effectiveStatus(req: { status: AlertStatus; expiresAt: Date | null }, now = new Date()): AlertStatus {
  if (req.status === "OPEN" && req.expiresAt && req.expiresAt.getTime() <= now.getTime()) return "EXPIRED";
  return req.status;
}

export const isLive = (req: { status: AlertStatus; expiresAt: Date | null }, now = new Date()) => effectiveStatus(req, now) === "OPEN";

/** A person who can be asked right now: finished joining, alerts on, able to give, a donor (not hospital or lab staff). */
export interface Askable {
  id: string;
  onboardingComplete: boolean;
  isAvailable: boolean;
  isEligible: boolean;
  nextEligible: Date | null;
  bloodType: BloodType | null;
  hospitalId: string | null;
  labId: string | null;
}

export function canBeAsked(u: Askable, needed: BloodType, now = new Date()): boolean {
  if (!u.onboardingComplete || !u.isAvailable || !u.isEligible) return false;
  if (u.nextEligible && u.nextEligible.getTime() > now.getTime()) return false;
  if (u.hospitalId || u.labId) return false;
  return u.bloodType !== null && canDonateTo(u.bloodType, needed);
}

export interface NearbyCandidate {
  id: string;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
}

/**
 * The people nearby to widen to: inside the radius (or, with no position on either side, in the same city),
 * nearest first, capped, and never anyone already alerted or the requester.
 */
export function pickNearby<T extends NearbyCandidate>(
  candidates: readonly T[],
  origin: { latitude: number | null; longitude: number | null; city: string | null },
  skip: ReadonlySet<string>,
): T[] {
  const hasOrigin = origin.latitude !== null && origin.longitude !== null;
  const scored: { c: T; km: number }[] = [];
  for (const c of candidates) {
    if (skip.has(c.id)) continue;
    if (hasOrigin && c.latitude !== null && c.longitude !== null) {
      const km = haversineDistanceKm(origin.latitude!, origin.longitude!, c.latitude, c.longitude);
      if (km <= ALERT.nearbyKm) scored.push({ c, km });
    } else if (origin.city && c.city && origin.city.trim().toLowerCase() === c.city.trim().toLowerCase()) {
      // No positions to measure: the same city is the next best thing, ranked after anyone measured.
      scored.push({ c, km: ALERT.nearbyKm + 1 });
    }
  }
  return scored.sort((a, b) => a.km - b.km).slice(0, ALERT.nearbyMax).map((s) => s.c);
}

export interface Answered {
  answer: "COMING" | "CANT" | null;
}

export const comingCount = (rs: readonly Answered[]) => rs.filter((r) => r.answer === "COMING").length;

/** Time to widen? Only for a live, real request that has not widened yet and does not yet have enough yes answers. */
export function shouldWiden(
  req: { status: AlertStatus; expiresAt: Date | null; isTest: boolean; widenAt: Date | null; widenedAt: Date | null },
  recipients: readonly Answered[],
  now = new Date(),
): boolean {
  if (req.isTest || req.widenedAt || !req.widenAt) return false;
  if (!isLive(req, now) || req.widenAt.getTime() > now.getTime()) return false;
  return comingCount(recipients) < ALERT.enoughYes;
}

/**
 * Talk of payment has no place in a request for blood. BloodPod's pledge, and its Terms, say nobody
 * pays for or is paid for giving blood, so a request that offers money is turned back, not posted.
 */
export function mentionsPayment(...texts: (string | null | undefined)[]): boolean {
  const all = texts.filter(Boolean).join(" ");
  return /(\bpay(ing|ment|s|ed)?\b|\bpaid\b|reward|\bcash\b|\bmoney\b|\bcedis?\b|\bghs\b|gh₵|₵|\bgh¢|\bbribe|\bincentive|\bfee\b|\bbuy(ing)?\b|\bsell(ing)?\b|\bbonus\b|\$\s?\d|\b\d+\s?(cedis?|ghs)\b)/i.test(all);
}

export interface AlertInput {
  bloodType: string;
  urgency: string;
  facility: string;
  location: string | null;
  message: string | null;
}

/** Cleans what a person typed. Returns an error to show, or the tidy values. */
export function cleanAlertInput(raw: Record<string, unknown>, isBloodType: (v: string) => boolean):
  | { ok: true; value: { bloodType: BloodType; urgency: RequestUrgency; facility: string; location: string | null; message: string | null } }
  | { ok: false; error: string } {
  const bloodType = String(raw.bloodType ?? "");
  const urgency = String(raw.urgency ?? "");
  const facility = String(raw.facility ?? "").trim().slice(0, ALERT.facilityMax);
  const location = String(raw.location ?? "").trim().slice(0, ALERT.locationMax) || null;
  const message = String(raw.message ?? "").trim().slice(0, ALERT.messageMax) || null;

  if (!isBloodType(bloodType)) return { ok: false, error: "Choose the blood type that is needed." };
  if (urgency !== "CRITICAL" && urgency !== "URGENT" && urgency !== "STANDARD") return { ok: false, error: "Choose how urgent it is." };
  if (facility.length < 2) return { ok: false, error: "Say which hospital or clinic the blood is needed at." };
  if (mentionsPayment(facility, location, message)) {
    return { ok: false, error: "Blood is never bought, sold or paid for on BloodPod. Please take out any mention of money or rewards." };
  }
  return { ok: true, value: { bloodType: bloodType as BloodType, urgency: urgency as RequestUrgency, facility, location, message } };
}

export const firstName = (name: string | null | undefined): string | null => {
  const f = (name ?? "").trim().split(/\s+/)[0];
  return f ? f : null;
};

/** What the person who asked may see of someone who answered: only a yes shows a name and a number. */
export function responderView(
  r: { answer: "COMING" | "CANT" | null },
  person: { name: string | null; phone: string | null },
): { firstName: string | null; fullName?: string | null; phone?: string | null } {
  return r.answer === "COMING" ? { firstName: firstName(person.name), fullName: person.name, phone: person.phone } : { firstName: firstName(person.name) };
}

/** What a donor may see of the person who asked: a first name, and the number only after saying yes. */
export function requesterView(
  r: { answer: "COMING" | "CANT" | null },
  person: { name: string | null; phone: string | null },
): { firstName: string | null; phone: string | null } {
  return { firstName: firstName(person.name), phone: r.answer === "COMING" ? person.phone : null };
}

/** Seconds from raising a request to the first yes, or null when nobody has said yes. */
export function secondsToFirstYes(createdAt: Date, recipients: readonly { answer: "COMING" | "CANT" | null; answeredAt: Date | null }[]): number | null {
  const times = recipients.filter((r) => r.answer === "COMING" && r.answeredAt).map((r) => r.answeredAt!.getTime());
  return times.length ? Math.max(0, Math.round((Math.min(...times) - createdAt.getTime()) / 1000)) : null;
}

export const URGENCY_LABEL: Record<RequestUrgency, string> = { CRITICAL: "Critical", URGENT: "Urgent", STANDARD: "Needed" };
