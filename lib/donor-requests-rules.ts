/**
 * The rules for asking one donor for help from Discover, as plain functions so they can be tested
 * without a database. Who may see whose details is decided here and nowhere else.
 */

export const REQUEST_RULES = {
  /** Requests one person can have waiting at once. */
  openAtOnce: 3,
  /** Requests one person can send in 24 hours. */
  perDay: 10,
  /** After a decline, the same person cannot ask the same donor again for this long. */
  retryAfterDeclineDays: 7,
  /** A request nobody answers lapses after this long. */
  expiresHours: 48,
  messageMax: 200,
  /** Accepted requests stay visible (with contact details) for this long. */
  acceptedVisibleDays: 30,
} as const;

export type RequestStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED";
export type EffectiveStatus = RequestStatus | "EXPIRED";

export interface RequestLike {
  seekerId: string;
  donorId: string;
  status: RequestStatus;
  expiresAt: Date;
}

/** A pending request past its time counts as expired, with no job needed to flip it. */
export function effectiveStatus(req: Pick<RequestLike, "status" | "expiresAt">, now: Date = new Date()): EffectiveStatus {
  return req.status === "PENDING" && req.expiresAt.getTime() <= now.getTime() ? "EXPIRED" : req.status;
}

export const requestExpiry = (now: Date = new Date()) => new Date(now.getTime() + REQUEST_RULES.expiresHours * 3_600_000);

/** "Kwame Mensah" becomes "Kwame". Never the rest of the name. */
export function firstNameOf(name: string | null | undefined): string | null {
  return name?.trim().split(/\s+/)[0] || null;
}

/**
 * Full name and phone are shared only once the donor has accepted, and only between the two people
 * in that request. Everyone else, and everyone before acceptance, gets a first name at most.
 */
export function canSeeContact(req: RequestLike, viewerId: string, now: Date = new Date()): boolean {
  if (effectiveStatus(req, now) !== "ACCEPTED") return false;
  return viewerId === req.seekerId || viewerId === req.donorId;
}

export interface Person {
  name: string | null;
  phone: string | null;
}

export type PersonView = { firstName: string | null } | { firstName: string | null; fullName: string | null; phone: string | null };

/** What `viewerId` may see of `person` in this request. */
export function personView(req: RequestLike, viewerId: string, person: Person, now: Date = new Date()): PersonView {
  const firstName = firstNameOf(person.name);
  return canSeeContact(req, viewerId, now) ? { firstName, fullName: person.name, phone: person.phone } : { firstName };
}
