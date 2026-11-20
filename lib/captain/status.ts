import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { titleFor } from "@/lib/captain-config";
import { computeCaptainLevel, uniqueDonorCount } from "@/lib/captain/compute";
import { findIntegrityFlags } from "@/lib/captain/integrity";
import { lapseStage } from "@/lib/captain/lapse";
import { loadTree } from "@/lib/captain/load-tree";
import { emailCaptainApproved, emailCaptainLapsed, emailCaptainLapseWarning } from "@/lib/email/captain";
import { logActivity } from "@/lib/activity";

/**
 * Brings one leader's stored Captain status up to date with what the rules say now. Run after a
 * drill closes and every night. It is the only writer of the level and the lapse clock.
 *
 *  - A higher level creates a promotion. Level 1 approves itself unless a flag was raised; the rest
 *    wait for a person in /admin/captains.
 *  - Falling short of an approved level starts a 60-day grace. Day 30 warns, day 60 lapses.
 */

const tell = (userId: string, title: string, body: string) =>
  sendPushToUser(userId, { title, body, url: "/captain", tag: `captain-${userId}` }).catch(() => null);

export async function approveLevel(userId: string, podId: string, level: number) {
  await prisma.captainStatus.update({
    where: { userId },
    data: { approvedLevel: level, lapseStartedAt: null, lapseWarnedAt: null, lapsedAt: null },
  });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
  const title = titleFor(level);
  await logActivity(userId, "BADGE_EARNED", `You are now a ${title}`, "Open your Captain page to accept the pledge", { level, podId });
  await tell(userId, `You are now a ${title}`, "Thank you for building a stronger network.");
  if (user?.email) emailCaptainApproved({ to: user.email, userId, name: user.name, title, level });
}

export async function recomputeForUser(userId: string, now: Date = new Date()) {
  const pods = await prisma.pod.findMany({ where: { ownerId: userId }, select: { id: true } });
  if (pods.length === 0) return null;

  // A leader's level is the best of the Pods they lead.
  type Tree = NonNullable<Awaited<ReturnType<typeof loadTree>>>;
  let best: { podId: string; result: ReturnType<typeof computeCaptainLevel>; tree: Tree } | null = null;
  for (const p of pods) {
    const tree = await loadTree(p.id, now);
    if (!tree) continue;
    const result = computeCaptainLevel(tree, now);
    if (!best || (result.level ?? -1) > (best.result.level ?? -1)) best = { podId: p.id, result, tree };
  }
  if (!best) return null;

  const { result, tree, podId } = best;
  const status = await prisma.captainStatus.upsert({
    where: { userId },
    create: { userId, podId, level: result.level, computedAt: now },
    update: { podId, level: result.level, computedAt: now },
  });

  const approved = status.approvedLevel ?? -1;
  const level = result.level ?? -1;

  // Moving up.
  if (level > approved) {
    const existing = await prisma.captainPromotion.findFirst({
      where: { userId, toLevel: result.level!, status: { in: ["PENDING", "APPROVED"] } },
    });
    if (!existing) {
      const flags = findIntegrityFlags(tree);
      const auto = result.level === 1 && flags.length === 0;
      await prisma.captainPromotion.create({
        data: {
          userId,
          podId,
          toLevel: result.level!,
          status: auto ? "APPROVED" : "PENDING",
          autoApproved: auto,
          decidedAt: auto ? now : null,
          decidedBy: auto ? "automatic" : null,
          evidence: {
            level: result.level,
            title: result.title,
            drillPassed: result.drillPassed,
            qualifyingChildren: result.qualifyingChildren,
            children: result.children.map((c) => ({ podId: c.podId, qualifying: c.qualifying, reason: c.reason, level: c.level })),
            uniqueDonorsInTree: uniqueDonorCount(tree),
            computedAt: now.toISOString(),
          },
          flags: flags.map((f) => ({ code: f.code, podId: f.podId, detail: f.detail })),
        },
      });
      if (auto) await approveLevel(userId, podId, result.level!);
    }
  }

  // Falling short of what was approved.
  const fresh = await prisma.captainStatus.findUniqueOrThrow({ where: { userId } });
  if (fresh.approvedLevel !== null && level < fresh.approvedLevel) {
    if (!fresh.lapseStartedAt) {
      await prisma.captainStatus.update({ where: { userId }, data: { lapseStartedAt: now } });
    } else {
      const { stage, daysLeft } = lapseStage(fresh.lapseStartedAt, now);
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
      const title = titleFor(fresh.approvedLevel);
      if (stage === "warn" && !fresh.lapseWarnedAt) {
        await prisma.captainStatus.update({ where: { userId }, data: { lapseWarnedAt: now } });
        await tell(userId, `${daysLeft} days to keep your ${title} badge`, "A drill or a new Pod is all it takes.");
        if (user?.email) emailCaptainLapseWarning({ to: user.email, userId, name: user.name, title, daysLeft, stamp: fresh.lapseStartedAt.toISOString() });
      }
      if (stage === "lapsed" && !fresh.lapsedAt) {
        // The badge steps down to whatever the Pod still qualifies for; nobody loses their Pod.
        await prisma.captainStatus.update({
          where: { userId },
          data: { lapsedAt: now, approvedLevel: result.level, lapseStartedAt: null, lapseWarnedAt: null },
        });
        await tell(userId, `Your ${title} badge is paused`, "Meet the requirements again and it comes back.");
        if (user?.email) emailCaptainLapsed({ to: user.email, userId, name: user.name, title, stamp: now.toISOString() });
      }
    }
  } else if (fresh.lapseStartedAt) {
    await prisma.captainStatus.update({ where: { userId }, data: { lapseStartedAt: null, lapseWarnedAt: null } });
  }

  return result;
}

/** The leader of a Pod and everyone above them, since a child's drill can lift a parent's level. */
export async function recomputeForPodChain(podId: string) {
  const seen = new Set<string>();
  let current: string | null = podId;
  for (let i = 0; i < 7 && current && !seen.has(current); i++) {
    seen.add(current);
    const p: { ownerId: string; parentPodId: string | null } | null = await prisma.pod.findUnique({
      where: { id: current },
      select: { ownerId: true, parentPodId: true },
    });
    if (!p) break;
    await recomputeForUser(p.ownerId).catch((err) => console.error("[captain] recompute failed", err));
    current = p.parentPodId;
  }
}
