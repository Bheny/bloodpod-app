import { prisma } from "@/lib/prisma";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { getAvatarColor, getAvatarTextColor, getInitials } from "@/lib/formatters";
import { privacyName } from "@/lib/discover-data";

export interface TopDonor {
  id: string;
  displayName: string;
  initials: string;
  bgColor: string;
  textColor: string;
  avatarUrl: string | null;
  bloodType: string | null;
  donationCount: number;
  tier: string;
}

export async function getFeaturedArticles(limit = 5) {
  return prisma.article.findMany({
    where: { featured: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

export async function getTopDonors(viewerId: string, limit = 10): Promise<TopDonor[]> {
  const users = await prisma.user.findMany({
    where: { isPublic: true, id: { not: viewerId }, donations: { some: {} } },
    include: { _count: { select: { donations: true } } },
    orderBy: { donations: { _count: "desc" } },
    take: limit,
  });

  return users.map((u) => ({
    id: u.id,
    displayName: privacyName(u.name),
    initials: getInitials(u.name ?? "?"),
    bgColor: getAvatarColor(u.id),
    textColor: getAvatarTextColor(u.id),
    avatarUrl: u.avatarUrl,
    bloodType: u.bloodType ? BLOOD_TYPE_LABELS[u.bloodType] : null,
    donationCount: u._count.donations,
    tier: u.passportTier,
  }));
}

export function getPartners(limit = 10) {
  return prisma.partner.findMany({
    where: { verified: true },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}
