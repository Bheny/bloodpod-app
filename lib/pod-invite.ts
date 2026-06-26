import { prisma } from "@/lib/prisma";

const EXPIRY_DAYS = 7;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string) {
  return EMAIL_RE.test(email);
}

export function inviteExpiryDate() {
  return new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}

export function inviteUrlFor(token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/invite/${token}`;
}

export function createPodInvite({
  podId,
  senderId,
  email,
}: {
  podId: string;
  senderId: string;
  email?: string | null;
}) {
  return prisma.podInvite.create({
    data: {
      podId,
      senderId,
      email: email || null,
      expiresAt: inviteExpiryDate(),
    },
  });
}

/**
 * A "share link" invite has no email attached — it's the standing link
 * surfaced for WhatsApp/copy-link sharing. Reuse a live one if it exists
 * rather than minting a new token every time the invite page loads.
 */
export async function getOrCreateShareInvite(podId: string, senderId: string) {
  const existing = await prisma.podInvite.findFirst({
    where: { podId, email: null, status: "PENDING", expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;
  return createPodInvite({ podId, senderId, email: null });
}
