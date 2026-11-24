/**
 * The nudge bot's brain. Pure: facts in, messages out, no database, so every rule can be tested.
 *
 * It is a rules engine, not a chatbot: a nudge exists only when something about the person is true
 * (their Pod is thin, an invite is stuck), and it vanishes the moment it stops being true.
 * Tone rules, enforced by tests: about their safety and their people, never about our growth; no guilt,
 * no countdowns, no fake urgency, no rewards, and nothing about money.
 */

export const NUDGE = {
  /** People who can donate, in a Pod, before it can answer an emergency. Matches the ready card on Home. */
  podReady: 3,
  /** Someone who started signing up gets a friendly email after this many days, and again later. Then we stop. */
  finishSetupAfterDays: 1,
  finishSetupAgainAfterDays: 4,
  /** Older unfinished sign-ups are left alone: too long has passed for a nudge to feel kind. */
  finishSetupUntilDays: 30,
  /** A new account gets a couple of days to look around before anything asks it to invite. */
  thinAfterDays: 2,
  alertsOffAfterDays: 3,
  /** A pending invite this old is "stuck". */
  stalledAfterDays: 5,
  /** Someone who joined this recently is still worth saying hello to. */
  joinedWithinDays: 3,

  /** Phones: at most this many pushes, across every kind of nudge. */
  pushPerDay: 1,
  pushPerWeek: 2,
  emailPerWeek: 1,
  /** Ghana keeps UTC all year, so these are clock hours there too. Nothing is sent from 21:00 to 07:00. */
  quietFromHour: 21,
  quietToHour: 7,

  /** Ignored this many times in a row, a kind of nudge goes quiet for backOffDays. */
  backOffAfter: 3,
  backOffDays: 30,
} as const;

export type NudgeKind = "finish_setup" | "member_joined" | "invite_stalled" | "alerts_off" | "pod_thin";

interface KindConfig {
  /** Lower goes first. Only the top nudge is ever shown or sent. */
  priority: number;
  /** After they close it, or it is sent, the same nudge stays away this long. */
  cooldownDays: number;
  push: boolean;
  email: boolean;
  /** This kind is sent at most this many times to one person, ever. */
  maxEver?: number;
}

export const KINDS: Record<NudgeKind, KindConfig> = {
  // For people who have not finished signing up. They cannot be pushed yet, so it is email only: two, then stop.
  finish_setup: { priority: 0, cooldownDays: 3, push: false, email: true, maxEver: 2 },
  // Fresh and fleeting: say hello while it is warm. The email for this already exists, so it is push only.
  member_joined: { priority: 1, cooldownDays: 30, push: true, email: false },
  invite_stalled: { priority: 2, cooldownDays: 7, push: true, email: true },
  // Cannot be pushed: the whole point is that they have no way to be pushed yet.
  alerts_off: { priority: 3, cooldownDays: 10, push: false, email: true },
  pod_thin: { priority: 4, cooldownDays: 6, push: true, email: true },
};

export const NUDGE_KINDS = Object.keys(KINDS) as NudgeKind[];

export const KIND_LABEL: Record<NudgeKind, string> = {
  finish_setup: "Finish setting up",
  member_joined: "Someone joined",
  invite_stalled: "Invite is stuck",
  alerts_off: "Alerts are off",
  pod_thin: "Pod is thin",
};

export interface NudgeFacts {
  firstName: string | null;
  accountAgeDays: number;
  onboardingComplete: boolean;
  nudgesOff: boolean;
  hasPush: boolean;
  /** They are in the middle of a live blood request. Nothing else matters until it is over. */
  inEmergency: boolean;
  /** Their own Pod, a Pod they only belong to, or no Pod at all. */
  podState: "none" | "owner" | "member";
  /** People who can donate in their (smallest) own Pod, counted once. */
  podReadyCount: number;
  /** Pending, unexpired invites that have waited stalledAfterDays or more. */
  stalledInvites: number;
  /** People who joined one of their Pods lately, newest first. */
  newMembers: { userId: string; name: string | null }[];
}

export interface NudgeCandidate {
  kind: NudgeKind;
  /** What it is about, when one kind can be about different things. */
  key: string;
  title: string;
  body: string;
  cta: { label: string; href: string };
}

export const firstWord = (name: string | null | undefined) => name?.trim().split(/\s+/)[0] || null;

const people = (n: number) => (n === 1 ? "person" : "people");

/** Every nudge that is true right now, most valuable first. */
export function dueNudges(f: NudgeFacts): NudgeCandidate[] {
  if (f.nudgesOff || f.inEmergency) return [];

  // Not signed up yet: the only thing worth saying is how close they are.
  if (!f.onboardingComplete) {
    if (f.accountAgeDays < NUDGE.finishSetupAfterDays || f.accountAgeDays > NUDGE.finishSetupUntilDays) return [];
    const again = f.accountAgeDays >= NUDGE.finishSetupAgainAfterDays;
    return [
      {
        kind: "finish_setup",
        key: "",
        title: again ? "Your Pod is saving you a seat" : "Two minutes to finish setting up",
        body: again
          ? "You are one short step from being counted. Pick up right where you stopped, it takes about two minutes."
          : "Your Pod cannot count on you until your profile is done. It takes about two minutes, and we saved where you got to.",
        cta: { label: "Finish setting up", href: "/onboarding" },
      },
    ];
  }
  const out: NudgeCandidate[] = [];

  if (f.newMembers.length > 0) {
    const [first, ...rest] = f.newMembers;
    const who = firstWord(first.name) ?? "Someone";
    out.push({
      kind: "member_joined",
      key: first.userId,
      title: rest.length > 0 ? `${who} and ${rest.length} more joined your Pod` : `${who} just joined your Pod`,
      body: "Go say hello! Every person in your Pod is one more person ready to show up.",
      cta: { label: "See your Pod", href: "/pod" },
    });
  }

  if (f.stalledInvites > 0) {
    out.push({
      kind: "invite_stalled",
      key: "",
      title: f.stalledInvites === 1 ? "Your invite is still waiting" : `${f.stalledInvites} invites are still waiting`,
      body: "Sometimes a friend just needs a little poke. A quick WhatsApp message usually does it.",
      cta: { label: "Send a reminder", href: "/pod/invite" },
    });
  }

  if (!f.hasPush && f.accountAgeDays >= NUDGE.alertsOffAfterDays) {
    out.push({
      kind: "alerts_off",
      key: "",
      title: "Psst, your alerts are off",
      body: "If your Pod needs you, you would be the last to know. Switching them on takes about ten seconds.",
      cta: { label: "Turn on alerts", href: "/profile/notifications" },
    });
  }

  if (f.accountAgeDays >= NUDGE.thinAfterDays && f.podState !== "member" && f.podReadyCount < NUDGE.podReady) {
    if (f.podState === "none") {
      out.push({
        kind: "pod_thin",
        key: "",
        title: "Your Pod is waiting for its first person",
        body: "A Pod is a few people you trust who show up for each other. Start with one friend or family member.",
        cta: { label: "Start my Pod", href: "/pod/invite" },
      });
    } else {
      const need = NUDGE.podReady - f.podReadyCount;
      out.push({
        kind: "pod_thin",
        key: "",
        title: `Your Pod is ${f.podReadyCount} of ${NUDGE.podReady}`,
        body: `Add ${need} more ${people(need)} who can donate and your Pod can answer an emergency. Who is the first person that comes to mind?`,
        cta: { label: "Invite someone", href: "/pod/invite" },
      });
    }
  }

  return out.sort((a, b) => KINDS[a.kind].priority - KINDS[b.kind].priority);
}

// ── Remembering what we already did ─────────────────────────────────────────

export interface NudgeRow {
  id: string;
  kind: string;
  key: string;
  createdAt: Date;
  pushedAt: Date | null;
  emailedAt: Date | null;
  dismissedAt: Date | null;
  actedAt: Date | null;
}

const DAY = 86_400_000;

export type Episode =
  /** Nothing has happened yet: a new row would start it. */
  | { state: "fresh" }
  /** Already on Home (and maybe sent), and they have not answered it. */
  | { state: "open"; row: NudgeRow }
  /** They closed it or did it, and the cooldown has not run out. */
  | { state: "closed" }
  /** They ignored it again and again, so this kind is resting. */
  | { state: "resting" };

/** Where this nudge stands with this person. `history` is any order, any kinds. */
export function episodeOf(c: Pick<NudgeCandidate, "kind" | "key">, history: NudgeRow[], now = new Date()): Episode {
  const cooldown = KINDS[c.kind].cooldownDays * DAY;
  const ofKind = history.filter((r) => r.kind === c.kind).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const latest = ofKind.find((r) => r.key === c.key);

  if (latest && now.getTime() - latest.createdAt.getTime() < cooldown) {
    return latest.dismissedAt || latest.actedAt ? { state: "closed" } : { state: "open", row: latest };
  }

  // A fresh episode would start. Has this kind said all it is allowed to say?
  const max = KINDS[c.kind].maxEver;
  if (max && ofKind.length >= max) return { state: "resting" };
  // Is it worn out?
  const last = ofKind.slice(0, NUDGE.backOffAfter);
  if (
    last.length === NUDGE.backOffAfter &&
    last.every((r) => !r.actedAt) &&
    now.getTime() - last[0].createdAt.getTime() < NUDGE.backOffDays * DAY
  ) {
    return { state: "resting" };
  }
  return { state: "fresh" };
}

export interface AppPick {
  candidate: NudgeCandidate;
  episode: Episode;
}

/** The one nudge to show on Home: the best that is not closed or resting. */
export function pickForApp(candidates: NudgeCandidate[], history: NudgeRow[], now = new Date()): AppPick | null {
  for (const candidate of candidates) {
    const episode = episodeOf(candidate, history, now);
    if (episode.state === "fresh" || episode.state === "open") return { candidate, episode };
  }
  return null;
}

export function inQuietHours(now = new Date()): boolean {
  const h = now.getUTCHours();
  return h >= NUDGE.quietFromHour || h < NUDGE.quietToHour;
}

const sentSince = (history: NudgeRow[], field: "pushedAt" | "emailedAt", since: number) =>
  history.filter((r) => r[field] && r[field]!.getTime() >= since).length;

export function canPush(history: NudgeRow[], now = new Date()): boolean {
  const t = now.getTime();
  return sentSince(history, "pushedAt", t - DAY) < NUDGE.pushPerDay && sentSince(history, "pushedAt", t - 7 * DAY) < NUDGE.pushPerWeek;
}

export function canEmail(history: NudgeRow[], now = new Date()): boolean {
  // Sign-up reminders have their own limit (two, ever), so they do not use up the weekly one.
  return sentSince(history.filter((r) => r.kind !== "finish_setup"), "emailedAt", now.getTime() - 7 * DAY) < NUDGE.emailPerWeek;
}

export type Channel = "push" | "email";

/**
 * What the daily sweep should send this person, if anything: one nudge, one channel.
 * Push when they have a device and the limits allow, otherwise email, never both for the same nudge.
 */
export function pickForSend(
  candidates: NudgeCandidate[],
  history: NudgeRow[],
  hasPush: boolean,
  now = new Date(),
): { candidate: NudgeCandidate; row: NudgeRow | null; channel: Channel } | null {
  if (inQuietHours(now)) return null;
  for (const candidate of candidates) {
    const episode = episodeOf(candidate, history, now);
    if (episode.state !== "fresh" && episode.state !== "open") continue;
    const row = episode.state === "open" ? episode.row : null;
    if (row && (row.pushedAt || row.emailedAt)) continue; // this one already went out
    const cfg = KINDS[candidate.kind];
    if (cfg.push && hasPush && canPush(history, now)) return { candidate, row, channel: "push" };
    if (cfg.email && (!hasPush || !cfg.push) && (candidate.kind === "finish_setup" || canEmail(history, now))) return { candidate, row, channel: "email" };
    // A person with a phone who has hit today's push limit waits; they are not emailed instead.
  }
  return null;
}

// ── Words for the phone and the inbox ───────────────────────────────────────

export function pushText(c: NudgeCandidate): { title: string; body: string } {
  return { title: c.title, body: c.body };
}
