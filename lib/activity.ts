import type { ActivityType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function logActivity(
  userId: string,
  type: ActivityType,
  title: string,
  subtitle?: string,
  metadata?: Prisma.InputJsonValue,
) {
  return prisma.activity.create({
    data: { userId, type, title, subtitle, metadata },
  });
}

export function getRecentActivity(userId: string, limit = 5) {
  return prisma.activity.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getActivityFeed(userId: string, page = 1, limit = 20) {
  const [items, total] = await Promise.all([
    prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.activity.count({ where: { userId } }),
  ]);

  return { items, total, page, limit, hasMore: page * limit < total };
}
