import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { inviteExpiryDate } from "@/lib/pod-invite";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ inviteId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { inviteId } = await params;
  const invite = await prisma.podInvite.findUnique({ where: { id: inviteId } });
  if (!invite || invite.senderId !== user.id) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  const updated = await prisma.podInvite.update({
    where: { id: inviteId },
    data: { expiresAt: inviteExpiryDate(), status: "PENDING" },
  });

  return NextResponse.json({ success: true, expiresAt: updated.expiresAt });
}
