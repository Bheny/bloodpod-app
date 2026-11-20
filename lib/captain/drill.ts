import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { CAPTAIN } from "@/lib/captain-config";
import { countedMembers } from "@/lib/captain/compute";
import type { TreeMember } from "@/lib/captain/types";

/**
 * Drills: a practice alert a Pod leader sends to their own Pod, to show the Pod would answer.
 *
 * It reuses the push path real alerts use, but it never competes with one: anyone with a real
 * request open for their blood type is left out, and the push carries its own tag so it cannot
 * replace or be replaced by an emergency notification. Who is picked has nothing to do with any
 * Captain level (a test guards that).
 */

const MIN = 60_000;
const DAY = 86_400_000;

type Result<T> = ({ ok: true } & T) | { ok: false; error: string; status: number };
const fail = (error: string, status = 400) => ({ ok: false as const, error, status });

export const drillClosesAt = (d: { startedAt: Date; windowMinutes: number }) => new Date(d.startedAt.getTime() + d.windowMinutes * MIN);

/** Passed: enough people were eligible, and enough of them answered in time. */
export function drillResult(eligibleCount: number, responded: number): boolean {
  return eligibleCount >= CAPTAIN.drillMinEligible && responded / eligibleCount >= CAPTAIN.drillPassRate;
}

async function podPeople(podId: string) {
  const pod = await prisma.pod.findUnique({
    where: { id: podId },
    include: {
      owner: { select: { id: true, name: true, phone: true, phoneVerifiedAt: true, isEligible: true, nextEligible: true, bloodType: true } },
      members: {
        select: {
          joinedAt: true,
          user: { select: { id: true, name: true, phone: true, phoneVerifiedAt: true, isEligible: true, nextEligible: true, bloodType: true } },
        },
      },
    },
  });
  if (!pod) return null;
  const now = new Date();
  const toMember = (u: (typeof pod.owner), joinedAt: Date): TreeMember & { bloodType: string | null } => ({
    userId: u.id,
    phone: u.phone,
    phoneVerified: !!u.phoneVerifiedAt,
    eligible: u.isEligible && (!u.nextEligible || u.nextEligible <= now),
    joinedAt,
    bloodType: u.bloodType,
  });
  return { pod, people: [toMember(pod.owner, pod.createdAt), ...pod.members.map((m) => toMember(m.user, m.joinedAt))] };
}

/** Blood types with a real request open right now. Anyone who could be asked to answer one is left alone. */
async function bloodTypesInRealNeed(): Promise<Set<string>> {
  const open = await prisma.bloodRequest.findMany({ where: { status: "OPEN" }, select: { bloodType: true } });
  return new Set(open.map((r) => r.bloodType));
}

export async function startDrill(userId: string, podId: string): Promise<Result<{ id: string; sent: number; eligible: number }>> {
  const found = await podPeople(podId);
  if (!found || found.pod.ownerId !== userId) return fail("Pod not found", 404);

  const last = await prisma.drill.findFirst({ where: { podId }, orderBy: { startedAt: "desc" } });
  if (last && Date.now() - last.startedAt.getTime() < CAPTAIN.drillCooldownDays * DAY) {
    return fail(`You can run one drill a week. Try again after ${new Date(last.startedAt.getTime() + CAPTAIN.drillCooldownDays * DAY).toDateString()}.`, 429);
  }

  // A drill that is still open blocks a second one, whatever the week says.
  const stillOpen = last && !last.closedAt && Date.now() < drillClosesAt(last).getTime();
  if (stillOpen) return fail("A drill is already running.", 409);

  const need = await bloodTypesInRealNeed();
  const counted = countedMembers({ members: found.people });
  const byId = new Map(found.people.map((p) => [p.userId, p]));
  const recipients = counted.filter((m) => {
    const bt = byId.get(m.userId)?.bloodType;
    return !(bt && need.has(bt));
  });
  if (recipients.length < CAPTAIN.drillMinEligible) {
    return fail(
      `A drill needs at least ${CAPTAIN.drillMinEligible} verified, eligible people who are free right now. You have ${recipients.length}.`,
      409,
    );
  }

  const drill = await prisma.drill.create({
    data: { podId, startedById: userId, windowMinutes: CAPTAIN.drillWindowMinutes, eligibleCount: recipients.length },
  });

  // The leader started it, so they are present: counted as answered at once.
  if (recipients.some((m) => m.userId === userId)) {
    await prisma.drillResponse.create({ data: { drillId: drill.id, userId, secondsToRespond: 0 } });
    await prisma.drill.update({ where: { id: drill.id }, data: { respondedCount: 1 } });
  }

  let sent = 0;
  await Promise.all(
    recipients
      .filter((m) => m.userId !== userId)
      .map(async (m) => {
        const r = await sendPushToUser(m.userId, {
          title: "Practice alert: this is only a drill",
          body: `${found.pod.name} is checking it can answer fast. Tap to say you are here.`,
          url: `/captain/drill/${drill.id}`,
          tag: `drill-${drill.id}`, // its own tag: it can never replace a real emergency notification
        }).catch(() => null);
        if (r && r.sent > 0) sent++;
      }),
  );

  return { ok: true, id: drill.id, sent, eligible: recipients.length };
}

export async function respondToDrill(userId: string, drillId: string): Promise<Result<{ secondsToRespond: number }>> {
  const drill = await prisma.drill.findUnique({ where: { id: drillId } });
  if (!drill) return fail("Drill not found", 404);

  const found = await podPeople(drill.podId);
  if (!found || !found.people.some((p) => p.userId === userId)) return fail("Drill not found", 404);

  const now = Date.now();
  if (drill.closedAt || now > drillClosesAt(drill).getTime()) return fail("This drill has ended.", 410);

  const seconds = Math.max(0, Math.round((now - drill.startedAt.getTime()) / 1000));
  try {
    await prisma.drillResponse.create({ data: { drillId, userId, secondsToRespond: seconds } });
  } catch {
    return { ok: true, secondsToRespond: seconds }; // already answered: same result, not an error
  }
  await prisma.$transaction([
    prisma.drill.update({ where: { id: drillId }, data: { respondedCount: { increment: 1 } } }),
    prisma.pod.update({ where: { id: drill.podId }, data: { lastActivityAt: new Date() } }),
  ]);
  return { ok: true, secondsToRespond: seconds };
}

/**
 * Closes a drill whose window is over and records whether it passed. Safe to call any number of
 * times: it only ever closes a drill once. Returns the drill's pod when it just closed one.
 */
export async function closeDrillIfOver(drillId: string): Promise<{ closedNow: boolean; podId: string } | null> {
  const drill = await prisma.drill.findUnique({ where: { id: drillId } });
  if (!drill) return null;
  if (drill.closedAt) return { closedNow: false, podId: drill.podId };
  if (Date.now() < drillClosesAt(drill).getTime()) return { closedNow: false, podId: drill.podId };

  // updateMany with closedAt: null makes two simultaneous callers close it only once.
  const done = await prisma.drill.updateMany({
    where: { id: drillId, closedAt: null },
    data: { closedAt: drillClosesAt(drill), passed: drillResult(drill.eligibleCount, drill.respondedCount) },
  });
  return { closedNow: done.count === 1, podId: drill.podId };
}
