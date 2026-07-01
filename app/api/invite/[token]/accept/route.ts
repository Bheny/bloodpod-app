import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { recalculatePodStrength } from "@/lib/pod-strength";
import { logActivity } from "@/lib/activity";
import { findInviteByIdentifier } from "@/lib/pod-invite";
import { isPodFull } from "@/lib/pod-limits";

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

  // The pod owner "accepting" their own pod's invite (e.g. testing their own
  // share link while already signed in) isn't a join — it's a no-op.
  if (invite.pod.ownerId === user.id) {
    return NextResponse.json({
      success: true,
      alreadyOwner: true,
      pod: { name: invite.pod.name, slug: invite.pod.slug },
    });
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

  // The SHARE link/code is a standing, reusable door - unlike a DIRECT invite
  // (a promise already made to one specific person), each new join through it
  // is a fresh admission decision, so it's the one place the Free cap is
  // actually enforced at accept-time.
  if (!alreadyMember && invite.kind === "SHARE") {
    const pod = await prisma.pod.findUnique({
      where: { id: invite.podId },
      include: { owner: true, _count: { select: { members: true } } },
    });
    const memberCount = (pod?._count.members ?? 0) + 1; // +1 for the owner
    if (pod && isPodFull(memberCount, pod.owner.plan)) {
      return NextResponse.json(
        { error: "This pod is full. Ask the owner to upgrade to Pod Pro." },
        { status: 409 },
      );
    }
  }

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
