import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { appUrl } from "@/lib/email/send";
import { hi, sendNow } from "@/lib/email/notify";
import { countedMembers } from "@/lib/readiness/members";
import { podPeople } from "@/lib/readiness/people";
import {
  NUDGE,
  dueNudges,
  inQuietHours,
  pickForApp,
  pickForSend,
  pushText,
  type NudgeCandidate,
  type NudgeFacts,
  type NudgeRow,
} from "@/lib/nudge-rules";

const DAY = 86_400_000;

interface Who {
  id: string;
  name: string | null;
  createdAt: Date;
  onboardingComplete: boolean;
  nudgesOff: boolean;
}

/** What is true about this person right now. Every nudge is decided from these and nothing else. */
export async function getNudgeFacts(user: Who, now = new Date()): Promise<NudgeFacts> {
  const [pushCount, owned, memberships, newMembers, stalled, live] = await Promise.all([
    prisma.pushSubscription.count({ where: { userId: user.id } }),
    prisma.pod.findMany({ where: { ownerId: user.id }, select: { id: true } }),
    prisma.podMember.count({ where: { userId: user.id, pod: { ownerId: { not: user.id } } } }),
    prisma.podMember.findMany({
      where: {
        pod: { ownerId: user.id },
        userId: { not: user.id },
        joinedAt: { gte: new Date(now.getTime() - NUDGE.joinedWithinDays * DAY) },
      },
      orderBy: { joinedAt: "desc" },
      take: 5,
      select: { user: { select: { id: true, name: true } } },
    }),
    prisma.podInvite.count({
      where: {
        senderId: user.id,
        kind: "DIRECT",
        status: "PENDING",
        expiresAt: { gt: now },
        createdAt: { lte: new Date(now.getTime() - NUDGE.stalledAfterDays * DAY) },
      },
    }),
    // A live request they were alerted about, or one they raised themselves.
    prisma.bloodRequest.count({
      where: {
        isTest: false,
        status: "OPEN",
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        AND: [{ OR: [{ requesterId: user.id }, { recipients: { some: { userId: user.id } } }] }],
      },
    }),
  ]);

  // The smallest of their own Pods is the one that needs people.
  let podReadyCount = 0;
  if (owned.length > 0) {
    const counts = await Promise.all(
      owned.map(async (p) => {
        const r = await podPeople(p.id);
        return r ? countedMembers(r.people).length : 0;
      }),
    );
    podReadyCount = Math.min(...counts);
  }

  return {
    firstName: user.name?.trim().split(/\s+/)[0] ?? null,
    accountAgeDays: Math.floor((now.getTime() - user.createdAt.getTime()) / DAY),
    onboardingComplete: user.onboardingComplete,
    nudgesOff: user.nudgesOff,
    hasPush: pushCount > 0,
    inEmergency: live > 0,
    podState: owned.length > 0 ? "owner" : memberships > 0 ? "member" : "none",
    podReadyCount,
    stalledInvites: stalled,
    newMembers: newMembers.map((m) => ({ userId: m.user.id, name: m.user.name })),
  };
}

const historyOf = (userId: string, now: Date): Promise<NudgeRow[]> =>
  prisma.nudge.findMany({ where: { userId, createdAt: { gte: new Date(now.getTime() - 60 * DAY) } } });

/** Where a tap goes: through us first, so we can tell it worked. Only paths inside the app. */
export function goUrl(id: string, href: string) {
  return `/api/nudges/${id}/go?to=${encodeURIComponent(href)}`;
}

export interface HomeNudge {
  id: string;
  kind: string;
  title: string;
  body: string;
  cta: { label: string; href: string };
}

/** The one nudge to show on Home, or null. Starts its record the first time it is shown. */
export async function nudgeForHome(user: Who): Promise<HomeNudge | null> {
  if (user.nudgesOff || !user.onboardingComplete) return null;
  const now = new Date();
  const [facts, history] = await Promise.all([getNudgeFacts(user, now), historyOf(user.id, now)]);
  const pick = pickForApp(dueNudges(facts), history, now);
  if (!pick) return null;

  const { candidate, episode } = pick;
  const row = episode.state === "open" ? episode.row : await prisma.nudge.create({ data: { userId: user.id, kind: candidate.kind, key: candidate.key } });
  return { id: row.id, kind: candidate.kind, title: candidate.title, body: candidate.body, cta: { ...candidate.cta, href: goUrl(row.id, candidate.cta.href) } };
}

/** They tapped it, or closed it. Only the first answer counts, and only for their own nudge. */
export async function answerNudge(userId: string, id: string, action: "acted" | "dismissed") {
  const field = action === "acted" ? "actedAt" : "dismissedAt";
  const res = await prisma.nudge.updateMany({ where: { id, userId, [field]: null }, data: { [field]: new Date() } });
  return res.count > 0;
}

/** Only places inside the app, so a link can never send someone elsewhere. */
export function safePath(to: string | null): string {
  return to && /^\/(?!\/)/.test(to) && !to.includes("\\") ? to : "/dashboard";
}

export async function setNudgesOff(userId: string, off: boolean) {
  await prisma.user.update({ where: { id: userId }, data: { nudgesOff: off } });
}

function emailFor(name: string | null, c: NudgeCandidate, rowId: string) {
  const footnote =
    c.kind === "finish_setup"
      ? "We will send you at most one more of these. If you would rather not hear from us, just reply to this email and say so."
      : "A small nudge from BloodPod, only because it is true for you right now. You can switch these off any time in Notifications.";
  return {
    subject: c.title,
    preheader: c.body,
    heading: c.title,
    paragraphs: [hi(name), c.body],
    cta: { label: c.cta.label, url: appUrl(goUrl(rowId, c.cta.href)) },
    footnote,
  };
}

export interface SweepResult {
  looked: number;
  pushed: number;
  emailed: number;
  skipped?: "quiet";
}

type Sendable = Who & { email: string };

/** Works out the single best nudge for one person and sends it if the limits allow. Returns the channel used. */
async function sendOne(u: Sendable, now: Date): Promise<"push" | "email" | null> {
  const [facts, history] = await Promise.all([getNudgeFacts(u, now), historyOf(u.id, now)]);
  const send = pickForSend(dueNudges(facts), history, facts.hasPush, now);
  if (!send) return null;

  const { candidate, channel } = send;
  const row = send.row ?? (await prisma.nudge.create({ data: { userId: u.id, kind: candidate.kind, key: candidate.key } }));

  if (channel === "push") {
    const text = pushText(candidate);
    const r = await sendPushToUser(u.id, { ...text, url: goUrl(row.id, candidate.cta.href), tag: `nudge-${candidate.kind}` });
    if (r.sent === 0) return null;
    await prisma.nudge.update({ where: { id: row.id }, data: { pushedAt: now } });
    return "push";
  }
  await prisma.nudge.update({ where: { id: row.id }, data: { emailedAt: now } });
  return (await sendNow(u.email, emailFor(u.name, candidate, row.id), `nudge/${row.id}`)) ? "email" : null;
}

/** Something just happened to this person (a friend joined their Pod): see if it is worth a word right now. */
export async function nudgeNow(userId: string) {
  try {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, createdAt: true, onboardingComplete: true, nudgesOff: true },
    });
    if (!u || u.nudgesOff) return;
    await sendOne(u, new Date());
  } catch (err) {
    console.error("Nudge failed", err);
  }
}

/**
 * The autonomous part. Run daily: for each person, work out what is true, pick the single best nudge that
 * the limits allow, and send it by the quietest channel that fits. Safe to run twice: a nudge that has
 * already gone out in its episode is never sent again.
 */
export async function sweepNudges(limit = 800, now = new Date()): Promise<SweepResult> {
  const result: SweepResult = { looked: 0, pushed: 0, emailed: 0 };
  if (inQuietHours(now)) return { ...result, skipped: "quiet" };

  const users = await prisma.user.findMany({
    where: {
      nudgesOff: false,
      hospitalId: null,
      labId: null,
      // Anyone old enough to nudge at all: the rules decide who gets what.
      createdAt: { lte: new Date(now.getTime() - NUDGE.finishSetupAfterDays * DAY) },
    },
    select: { id: true, name: true, email: true, createdAt: true, onboardingComplete: true, nudgesOff: true },
    orderBy: { id: "asc" },
    take: limit,
  });

  for (let i = 0; i < users.length; i += 5) {
    await Promise.all(
      users.slice(i, i + 5).map(async (u) => {
        result.looked++;
        try {
          const channel = await sendOne(u, now);
          if (channel === "push") result.pushed++;
          if (channel === "email") result.emailed++;
        } catch (err) {
          console.error("Nudge failed for one person", err);
        }
      }),
    );
  }
  return result;
}
