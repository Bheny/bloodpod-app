/** Who counts as "ready" in a Pod. Plain data in, plain data out: no database, so every edge can be tested. */

export interface PodPerson {
  userId: string;
  phone: string | null;
  /** A real, finished account. Today that means the profile is complete; once phone codes exist, a verified phone (see READINESS.requireVerifiedPhone). */
  confirmed: boolean;
  eligible: boolean;
  joinedAt: Date;
}

/** Same person even if they signed up twice with the same number written differently. */
export function phoneKey(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 9 ? digits.slice(-9) : null;
}

const counts = (m: PodPerson) => m.confirmed && m.eligible;

export type DuplicateReason = "same_account" | "same_phone";

export interface Duplicate<T extends PodPerson> {
  person: T;
  /** The person already counted that this one matches. */
  sameAs: T;
  reason: DuplicateReason;
}

export interface SplitPeople<T extends PodPerson> {
  /** Verified, eligible, once each by account and by phone number. */
  counted: T[];
  /** Verified and eligible, but the same person as someone already counted. */
  duplicates: Duplicate<T>[];
  /** Everyone else: phone not verified yet, or not eligible to give right now. */
  notReady: T[];
}

/**
 * Tells each person in a list apart: who counts, who is the same person twice, and who is not ready yet.
 * The first to appear is the one kept. Pass the people from several Pods to count each person once across all of them.
 */
export function splitPeople<T extends PodPerson>(members: readonly T[]): SplitPeople<T> {
  const byId = new Map<string, T>();
  const byPhone = new Map<string, T>();
  const out: SplitPeople<T> = { counted: [], duplicates: [], notReady: [] };
  for (const m of members) {
    if (!counts(m)) {
      if (!byId.has(m.userId) && !out.notReady.some((n) => n.userId === m.userId)) out.notReady.push(m);
      continue;
    }
    const sameAccount = byId.get(m.userId);
    if (sameAccount) {
      out.duplicates.push({ person: m, sameAs: sameAccount, reason: "same_account" });
      continue;
    }
    const pk = phoneKey(m.phone);
    const samePhone = pk ? byPhone.get(pk) : undefined;
    if (samePhone) {
      out.duplicates.push({ person: m, sameAs: samePhone, reason: "same_phone" });
      continue;
    }
    byId.set(m.userId, m);
    if (pk) byPhone.set(pk, m);
    out.counted.push(m);
  }
  return out;
}

/** Everyone who counts in one Pod: verified, eligible, once each by account and by phone number. */
export function countedMembers<T extends PodPerson>(members: readonly T[]): T[] {
  return splitPeople(members).counted;
}
