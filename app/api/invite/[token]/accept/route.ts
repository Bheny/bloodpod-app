import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { recalculatePodStrength } from "@/lib/pod-strength";
import { logActivity } from "@/lib/activity";
import { findInviteByIdentifier } from "@/lib/pod-invite";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token: identifier } = await params;
  const resolved = await findInviteByIdentifier(identifier);
  if (!resolved) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  const invite = await prisma.podInvite.findUnique({
    where: { id: resolved.id },
    include: { pod: true },
  });
  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }
  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
  }
  if (invite.status === "REVOKED") {
    return NextResponse.json({ error: "This invite is no longer valid" }, { status: 410 });
  }

  // A DIRECT invite is addressed to one person and is single-use: once
  // accepted, re-using it is a no-op success rather than a second join.
  // A SHARE invite (the durable pod link/code) stays PENDING for its whole
  // lifetime and is meant to be joined by many different people.
  if (invite.kind === "DIRECT" && invite.status === "ACCEPTED") {
    return NextResponse.json({ success: true, pod: { name: invite.pod.name, slug: invite.pod.slug } });
  }

  const alreadyMember = await prisma.podMember.findUnique({
    where: { podId_userId: { podId: invite.podId, userId: user.id } },
  });

  await prisma.podMember.upsert({
    where: { podId_userId: { podId: invite.podId, userId: user.id } },
    create: { podId: invite.podId, userId: user.id },
    update: {},
  });

  if (invite.kind === "DIRECT") {
    await prisma.podInvite.update({ where: { id: invite.id }, data: { status: "ACCEPTED" } });
  }

  if (!alreadyMember) {
    await recalculatePodStrength(invite.pod.ownerId);
    await logActivity(
      invite.pod.ownerId,
      "MEMBER_JOINED",
      `${user.name ?? "Someone"} joined your pod`,
      invite.pod.name,
    );
  }

  return NextResponse.json({ success: true, pod: { name: invite.pod.name, slug: invite.pod.slug } });
}
