import { prisma } from "@/lib/prisma";

export function getUserCards(userId: string) {
  return prisma.idCard.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export function getUserDocuments(userId: string) {
  return prisma.document.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export function getUserCard(userId: string, cardId: string) {
  return prisma.idCard.findFirst({ where: { id: cardId, userId } });
}

export function getUserDocument(userId: string, documentId: string) {
  return prisma.document.findFirst({ where: { id: documentId, userId } });
}
