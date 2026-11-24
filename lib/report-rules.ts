/**
 * Reporting a person. Pure rules, so they can be tested.
 * A report is a way to tell us something is wrong, never an accusation that acts on its own: the most it does
 * by itself is pause the account's reach (not listed, not asked, cannot raise a request) until a person at
 * BloodPod has looked. The reported person is never told who reported them.
 */

export const REPORT = {
  /** This many different people reporting the same account pauses its reach until an admin looks. */
  holdAt: 3,
  /** One person can only send this many reports a day, so a report cannot be used to harass. */
  perDay: 5,
  noteMax: 300,
} as const;

export const REASONS = [
  { id: "FAKE_DETAILS", label: "Details look fake", hint: "Made-up name, number or blood type" },
  { id: "ASKED_FOR_PAYMENT", label: "Asked for or offered payment", hint: "Blood is never bought or sold on BloodPod" },
  { id: "NO_SHOW", label: "Said they would come and did not", hint: "" },
  { id: "HARASSMENT", label: "Rude, scary or unwanted contact", hint: "" },
  { id: "OTHER", label: "Something else", hint: "" },
] as const;

export type ReasonId = (typeof REASONS)[number]["id"];
export const REASON_LABEL = Object.fromEntries(REASONS.map((r) => [r.id, r.label])) as Record<ReasonId, string>;

export type Cleaned = { ok: true; value: { userId: string; reason: ReasonId; note: string | null } } | { ok: false; error: string };

export function cleanReport(raw: Record<string, unknown>): Cleaned {
  const userId = typeof raw.userId === "string" ? raw.userId.trim() : "";
  if (!userId) return { ok: false, error: "Choose who you are reporting." };
  const reason = REASONS.find((r) => r.id === raw.reason)?.id;
  if (!reason) return { ok: false, error: "Choose what went wrong." };
  const note = typeof raw.note === "string" ? raw.note.trim().replace(/\s+/g, " ").slice(0, REPORT.noteMax) : "";
  return { ok: true, value: { userId, reason, note: note || null } };
}

/** Pause an account's reach once enough different people have reported it. */
export function shouldHold(distinctOpenReporters: number): boolean {
  return distinctOpenReporters >= REPORT.holdAt;
}
