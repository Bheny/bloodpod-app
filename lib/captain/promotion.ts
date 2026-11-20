import { prisma } from "@/lib/prisma";
import { titleFor } from "@/lib/captain-config";
import { approveLevel } from "@/lib/captain/status";
import { sendPushToUser } from "@/lib/push";

type Result = { ok: true } | { ok: false; error: string; status: number };
const fail = (error: string, status = 400): Result => ({ ok: false, error, status });

/** An admin's decision on a waiting promotion. A rejection always carries a reason. */
export async function decidePromotion(id: string, decision: "APPROVED" | "REJECTED", actorEmail: string, reason: string | null): Promise<Result> {
  const promo = await prisma.captainPromotion.findUnique({ where: { id } });
  if (!promo) return fail("Promotion not found", 404);
  if (promo.status !== "PENDING") return fail("That one has already been decided", 409);
  if (decision === "REJECTED" && !reason?.trim()) return fail("Add a short reason so you remember why");

  await prisma.captainPromotion.update({
    where: { id },
    data: { status: decision, decidedBy: actorEmail, decisionReason: reason?.trim() || null, decidedAt: new Date() },
  });
  await prisma.captainAuditLog.create({
    data: {
      actorEmail,
      userId: promo.userId,
      action: decision === "APPROVED" ? "approve" : "reject",
      toLevel: promo.toLevel,
      reason: reason?.trim() || "Approved after review",
    },
  });

  if (decision === "APPROVED") {
    // The status row exists: the promotion was created from it.
    await approveLevel(promo.userId, promo.podId, promo.toLevel);
  } else {
    await sendPushToUser(promo.userId, {
      title: "About your Captain level",
      body: "We could not confirm it yet. Open your Captain page to see what to check.",
      url: "/captain",
      tag: `captain-${promo.userId}`,
    }).catch(() => null);
  }
  return { ok: true };
}

/** A manual change by an admin, always with a reason and always written to the audit log. */
export async function overrideLevel(actorEmail: string, userId: string, level: number | null, reason: string): Promise<Result> {
  if (!reason.trim()) return fail("A reason is required for an override");
  const status = await prisma.captainStatus.findUnique({ where: { userId } });
  if (!status) return fail("That person has no Captain status yet", 404);

  await prisma.captainStatus.update({
    where: { userId },
    data: { approvedLevel: level, lapseStartedAt: null, lapseWarnedAt: null, lapsedAt: null },
  });
  await prisma.captainAuditLog.create({
    data: { actorEmail, userId, action: "override", fromLevel: status.approvedLevel, toLevel: level, reason: reason.trim() },
  });
  return { ok: true };
}

/** The pledge must be accepted before any badge shows. */
export async function acceptPledge(userId: string): Promise<Result> {
  const status = await prisma.captainStatus.findUnique({ where: { userId } });
  if (!status || status.approvedLevel === null) return fail("There is nothing to accept yet", 404);
  if (!status.pledgeAcceptedAt) await prisma.captainStatus.update({ where: { userId }, data: { pledgeAcceptedAt: new Date() } });
  return { ok: true };
}

/** What may be shown: a badge needs an approved level and the pledge. */
export function visibleBadge(status: { approvedLevel: number | null; pledgeAcceptedAt: Date | null } | null): { level: number; title: string } | null {
  if (!status || status.approvedLevel === null || !status.pledgeAcceptedAt) return null;
  return { level: status.approvedLevel, title: titleFor(status.approvedLevel) };
}
