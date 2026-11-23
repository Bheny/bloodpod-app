import { prisma } from "@/lib/prisma";
import { READINESS } from "@/lib/readiness-config";
import type { PodPerson } from "@/lib/readiness/members";

export type PodPersonWithBlood = PodPerson & { bloodType: string | null; name: string | null };

/** The fields toPodPerson reads. Use this select wherever people are loaded to be counted. */
export const personSelect = { id: true, name: true, phone: true, phoneVerifiedAt: true, onboardingComplete: true, isEligible: true, nextEligible: true, bloodType: true } as const;
const person = personSelect;

/** What a person needs to be counted: the same rule everywhere (a confirmed account, eligible right now). */
export function toPodPerson(
  u: { id: string; name: string | null; phone: string | null; phoneVerifiedAt: Date | null; onboardingComplete: boolean; isEligible: boolean; nextEligible: Date | null; bloodType: string | null },
  joinedAt: Date,
  now = new Date(),
): PodPersonWithBlood {
  return {
    userId: u.id,
    name: u.name,
    phone: u.phone,
    confirmed: READINESS.requireVerifiedPhone ? !!u.phoneVerifiedAt : u.onboardingComplete,
    eligible: u.isEligible && (!u.nextEligible || u.nextEligible <= now),
    joinedAt,
    bloodType: u.bloodType,
  };
}

/**
 * A Pod and everyone in it, owner first. The owner is not a PodMember row, so they are added here.
 * Reading only: nothing about plans, alerts or listing.
 */
export async function podPeople(podId: string) {
  const pod = await prisma.pod.findUnique({
    where: { id: podId },
    include: {
      owner: { select: person },
      members: { select: { joinedAt: true, user: { select: person } } },
    },
  });
  if (!pod) return null;
  const now = new Date();
  return { pod, people: [toPodPerson(pod.owner, pod.createdAt, now), ...pod.members.map((m) => toPodPerson(m.user, m.joinedAt, now))] };
}
