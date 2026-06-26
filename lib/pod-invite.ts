import { prisma } from "@/lib/prisma";
import type { InviteKind } from "@prisma/client";

const DIRECT_EXPIRY_DAYS = 7;
const SHARE_EXPIRY_DAYS = 365;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L
const CODE_LENGTH = 6;

export function isValidEmail(email: string) {
  return EMAIL_RE.test(email);
}

export function inviteExpiryDate() {
  return new Date(Date.now() + DIRECT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}

export function shareInviteExpiryDate() {
  return new Date(Date.now() + SHARE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}

export function inviteUrlFor(token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/invite/${token}`;
}

function randomCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

async function generateInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode();
    const existing = await prisma.podInvite.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique invite code");
}

export async function createPodInvite({
  podId,
  senderId,
  email,
  kind = "DIRECT",
}: {
  podId: string;
  senderId: string;
  email?: string | null;
  kind?: InviteKind;
}) {
  const code = await generateInviteCode();
  return prisma.podInvite.create({
    data: {
      podId,
      senderId,
      email: email || null,
      code,
      kind,
      expiresAt: kind === "SHARE" ? shareInviteExpiryDate() : inviteExpiryDate(),
    },
  });
}

/**
 * A "share" invite has no email attached — it's the durable link+code
 * surfaced for WhatsApp/copy-link/code sharing. Unlike a direct invite it's
 * meant to be reused by many different people, so it's long-lived and reuses
 * an existing live one rather than minting a new token every page load.
 */
export async function getOrCreateShareInvite(podId: string, senderId: string) {
  const existing = await prisma.podInvite.findFirst({
    where: { podId, kind: "SHARE", status: "PENDING", expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;
  return createPodInvite({ podId, senderId, email: null, kind: "SHARE" });
}

/** Retires the pod's current share invite and mints a fresh token+code. */
export async function regenerateShareInvite(podId: string, senderId: string) {
  await prisma.podInvite.updateMany({
    where: { podId, kind: "SHARE", status: "PENDING" },
    data: { status: "REVOKED" },
  });
  return createPodInvite({ podId, senderId, email: null, kind: "SHARE" });
}

/** Resolves an invite by either its long token (from a link) or short code (typed in). */
export function findInviteByIdentifier(identifier: string) {
  const trimmed = identifier.trim();
  return prisma.podInvite.findFirst({
    where: {
      OR: [{ token: trimmed }, { code: trimmed.toUpperCase() }],
    },
  });
}
