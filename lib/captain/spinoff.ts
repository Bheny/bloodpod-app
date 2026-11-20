import { prisma } from "@/lib/prisma";
import { CAPTAIN } from "@/lib/captain-config";
import { getPodAllowance } from "@/lib/pod-access";
import { createPodInvite } from "@/lib/pod-invite";
import { FREE_POD_MEMBER_LIMIT } from "@/lib/pod-limits";
import { slugify } from "@/lib/slugify";
import { emailPodInvite } from "@/lib/email/notify";

const DAY = 86_400_000;

/**
 * "Start a Pod from your invites". A member who brought in enough people, who have all joined and
 * finished their profile, can lead a Pod of their own. Nobody is moved: every one of them gets an
 * invitation and chooses whether to accept.
 */

export interface SpinoffOffer {
  podId: string;
  podName: string;
  invitees: { id: string; name: string | null; email: string }[];
  canStart: boolean;
}

/** Pods where this person is a member (not the leader) and invited enough people who finished their profile. */
export async function getSpinoffOffers(userId: string): Promise<SpinoffOffer[]> {
  const memberships = await prisma.podMember.findMany({
    where: { userId },
    select: { podId: true, pod: { select: { name: true, ownerId: true } } },
  });

  const offers: SpinoffOffer[] = [];
  for (const m of memberships) {
    if (m.pod.ownerId === userId) continue;
    const invited = await prisma.podMember.findMany({
      where: { podId: m.podId, invitedById: userId, user: { onboardingComplete: true } },
      select: { user: { select: { id: true, name: true, email: true } } },
    });
    if (invited.length === 0) continue;
    offers.push({
      podId: m.podId,
      podName: m.pod.name,
      invitees: invited.map((i) => i.user),
      canStart: invited.length >= CAPTAIN.spinoffMinInvitees,
    });
  }
  return offers;
}

type Result = { ok: true; podId: string; invited: number } | { ok: false; error: string; status: number };
const fail = (error: string, status = 400): Result => ({ ok: false, error, status });

export async function startSpinoff(user: { id: string; name: string | null }, podId: string, name: string): Promise<Result> {
  const trimmed = name.trim().slice(0, 60);
  if (trimmed.length < 2) return fail("Give your Pod a name (at least 2 characters).");

  const offer = (await getSpinoffOffers(user.id)).find((o) => o.podId === podId);
  if (!offer) return fail("You can only start a Pod from a Pod you joined.", 404);
  if (!offer.canStart) {
    return fail(`You need ${CAPTAIN.spinoffMinInvitees} people you invited to have joined and finished their profile. You have ${offer.invitees.length}.`, 409);
  }

  // The usual limit on leading Pods, plus a weekly cap on spin-offs.
  const allowance = await getPodAllowance(user.id);
  if (!allowance.canCreate) return fail(`You can lead up to ${allowance.limit} Pods.`, 402);
  const thisWeek = await prisma.pod.count({
    where: { spawnedByUserId: user.id, createdAt: { gt: new Date(Date.now() - 7 * DAY) } },
  });
  if (thisWeek >= CAPTAIN.spinoffsPerWeek) return fail(`You can start ${CAPTAIN.spinoffsPerWeek} new Pods a week. Try again soon.`, 429);

  const base = slugify(trimmed);
  let slug = base;
  for (let i = 1; await prisma.pod.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;

  // parentPodId is written here and nowhere else: a Pod's lineage is set once.
  const pod = await prisma.pod.create({
    data: { name: trimmed, slug, ownerId: user.id, parentPodId: podId, spawnedByUserId: user.id },
  });

  // Invitations, not memberships. Each person decides.
  const invitees = offer.invitees.slice(0, FREE_POD_MEMBER_LIMIT - 1);
  for (const person of invitees) {
    const invite = await createPodInvite({ podId: pod.id, senderId: user.id, email: person.email });
    emailPodInvite({
      to: person.email,
      inviteId: invite.id,
      inviterName: user.name,
      podName: pod.name,
      token: invite.token,
      expiresAt: invite.expiresAt,
    });
  }

  return { ok: true, podId: pod.id, invited: invitees.length };
}
