/** Who counts as "ready" in a Pod. Plain data in, plain data out: no database, so every edge can be tested. */

export interface PodPerson {
  userId: string;
  phone: string | null;
  phoneVerified: boolean;
  eligible: boolean;
  joinedAt: Date;
}

/** Same person even if they signed up twice with the same number written differently. */
export function phoneKey(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 9 ? digits.slice(-9) : null;
}

const counts = (m: PodPerson) => m.phoneVerified && m.eligible;

/** Everyone who counts in one Pod: verified, eligible, once each by account and by phone number. */
export function countedMembers<T extends PodPerson>(members: readonly T[]): T[] {
  const seenIds = new Set<string>();
  const seenPhones = new Set<string>();
  const out: T[] = [];
  for (const m of members) {
    if (!counts(m) || seenIds.has(m.userId)) continue;
    const pk = phoneKey(m.phone);
    if (pk && seenPhones.has(pk)) continue;
    seenIds.add(m.userId);
    if (pk) seenPhones.add(pk);
    out.push(m);
  }
  return out;
}
