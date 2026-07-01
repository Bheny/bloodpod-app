import { prisma } from "@/lib/prisma";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { findInviteByIdentifier } from "@/lib/pod-invite";

const AVATAR_COLORS = ["#FFE0E0", "#E0F2FE", "#DCFCE7", "#FEF9C3", "#F3E8FF"];

function initialsFor(name: string | null) {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase() || "??";
}

export interface InvitePreview {
  pod: { name: string; slug: string; memberCount: number; ownerId: string };
  inviter: {
    name: string | null;
    bloodType: string | null;
    donationCount: number;
    avatarUrl: string | null;
  };
  bloodTypesCovered: string[];
  members: { initials: string; bgColor: string }[];
}

export async function getInvitePreview(identifier: string): Promise<InvitePreview | null> {
  const resolved = await findInviteByIdentifier(identifier);
  if (!resolved || resolved.status !== "PENDING" || resolved.expiresAt < new Date()) {
    return null;
  }

  const invite = await prisma.podInvite.findUnique({
    where: { id: resolved.id },
    include: {
      sender: { include: { donations: true } },
      pod: {
        include: {
          owner: true,
          members: { include: { user: true }, orderBy: { joinedAt: "asc" } },
        },
      },
    },
  });

  if (!invite) return null;

  const allUsers = [invite.pod.owner, ...invite.pod.members.map((m) => m.user)];
  const bloodTypesCovered = Array.from(
    new Set(
      allUsers
        .map((u) => u.bloodType)
        .filter((bt): bt is NonNullable<typeof bt> => Boolean(bt)),
    ),
  ).map((bt) => BLOOD_TYPE_LABELS[bt]);

  return {
    pod: {
      name: invite.pod.name,
      slug: invite.pod.slug,
      memberCount: invite.pod.members.length,
      ownerId: invite.pod.ownerId,
    },
    inviter: {
      name: invite.sender.name,
      bloodType: invite.sender.bloodType ? BLOOD_TYPE_LABELS[invite.sender.bloodType] : null,
      donationCount: invite.sender.donations.length,
      avatarUrl: invite.sender.avatarUrl,
    },
    bloodTypesCovered,
    members: allUsers.slice(0, 5).map((u, i) => ({
      initials: initialsFor(u.name),
      bgColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
    })),
  };
}
