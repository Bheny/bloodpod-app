import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { inviteExpiryDate } from "@/lib/pod-invite";
import { emailPodInvite } from "@/lib/email/notify";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ inviteId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { inviteId } = await params;
  const invite = await prisma.podInvite.findUnique({ where: { id: inviteId }, include: { pod: { select: { name: true } } } });
  if (!invite || invite.senderId !== user.id) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  const updated = await prisma.podInvite.update({
    where: { id: inviteId },
    data: { expiresAt: inviteExpiryDate(), status: "PENDING" },
  });

  if (updated.email) {
    emailPodInvite({
      to: updated.email,
      inviteId: updated.id,
      inviterName: user.name,
      podName: invite.pod.name,
      token: updated.token,
      expiresAt: updated.expiresAt,
      resendStamp: String(Date.now()),
    });
  }

  return NextResponse.json({ success: true, expiresAt: updated.expiresAt });
}
