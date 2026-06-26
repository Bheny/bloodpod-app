import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { recalculatePodStrength } from "@/lib/pod-strength";
import { logActivity } from "@/lib/activity";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await params;
  const invite = await prisma.podInvite.findUnique({ where: { token }, include: { pod: true } });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }
  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
  }
  if (invite.status === "ACCEPTED") {
    return NextResponse.json({ success: true, pod: { name: invite.pod.name, slug: invite.pod.slug } });
  }

  await prisma.podMember.upsert({
    where: { podId_userId: { podId: invite.podId, userId: user.id } },
    create: { podId: invite.podId, userId: user.id },
    update: {},
  });

  await prisma.podInvite.update({ where: { id: invite.id }, data: { status: "ACCEPTED" } });
  await recalculatePodStrength(invite.pod.ownerId);
  await logActivity(
    invite.pod.ownerId,
    "MEMBER_JOINED",
    `${user.name ?? "Someone"} joined your pod`,
    invite.pod.name,
  );

  return NextResponse.json({ success: true, pod: { name: invite.pod.name, slug: invite.pod.slug } });
}
