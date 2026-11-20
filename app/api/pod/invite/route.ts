import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createPodInvite, inviteUrlFor, isValidEmail } from "@/lib/pod-invite";
import { isPodFull } from "@/lib/pod-limits";
import { emailPodInvite } from "@/lib/email/notify";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, podId } = (await request.json()) as { email?: string; podId?: string };
  if (!podId) {
    return NextResponse.json({ error: "podId is required" }, { status: 400 });
  }
  if (email && !isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const pod = await prisma.pod.findUnique({
    where: { id: podId },
    include: { owner: true, _count: { select: { members: true } } },
  });
  if (!pod || pod.ownerId !== user.id) {
    return NextResponse.json({ error: "Pod not found" }, { status: 404 });
  }
  if (isPodFull(pod._count.members + 1)) {
    return NextResponse.json(
      { error: "Your pod is at the Free plan's 20-member limit. Upgrade to Pod Pro to invite more." },
      { status: 402 },
    );
  }

  const invite = await createPodInvite({ podId, senderId: user.id, email });

  // The invite and its link exist either way; the email is a convenience on top.
  if (invite.email) {
    emailPodInvite({
      to: invite.email,
      inviteId: invite.id,
      inviterName: user.name,
      podName: pod.name,
      token: invite.token,
      expiresAt: invite.expiresAt,
    });
  }

  return NextResponse.json({
    success: true,
    token: invite.token,
    inviteUrl: inviteUrlFor(invite.token),
    inviteId: invite.id,
  });
}
