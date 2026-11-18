import { prisma } from "@/lib/prisma";
import { isPodFull } from "@/lib/pod-limits";

export interface ReceivedInvitation {
  id: string;
  token: string;
  podName: string;
  inviterName: string;
  memberCount: number;
  full: boolean;
  expiresAt: string;
}

/**
 * Invites addressed to this person's email that they have not answered yet.
 * Share links are not listed: they belong to whoever holds the link.
 */
export async function getReceivedInvitations(user: { id: string; email: string }): Promise<ReceivedInvitation[]> {
  const invites = await prisma.podInvite.findMany({
    where: {
      kind: "DIRECT",
      status: "PENDING",
      expiresAt: { gt: new Date() },
      email: { equals: user.email, mode: "insensitive" },
      pod: { ownerId: { not: user.id }, members: { none: { userId: user.id } } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      sender: { select: { name: true } },
      pod: { select: { name: true, _count: { select: { members: true } } } },
    },
  });

  return invites.map((inv) => {
    const memberCount = inv.pod._count.members + 1; // +1 for the owner
    return {
      id: inv.id,
      token: inv.token,
      podName: inv.pod.name,
      inviterName: inv.sender.name ?? "A BloodPod member",
      memberCount,
      full: isPodFull(memberCount),
      expiresAt: inv.expiresAt.toISOString(),
    };
  });
}
