import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createPodInvite } from "@/lib/pod-invite";
import { isPodFull } from "@/lib/pod-limits";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ podId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { podId } = await params;
  const { email } = (await request.json()) as { email?: string };
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const pod = await prisma.pod.findUnique({
    where: { id: podId },
    include: { owner: true, _count: { select: { members: true } } },
  });
  if (!pod || pod.ownerId !== user.id) {
    return NextResponse.json({ error: "Pod not found" }, { status: 404 });
  }
  if (isPodFull(pod._count.members + 1, pod.owner.plan)) {
    return NextResponse.json(
      { error: "Your pod is at the Free plan's 20-member limit. Upgrade to Pod Pro to invite more." },
      { status: 402 },
    );
  }

  const invite = await createPodInvite({ podId, senderId: user.id, email });

  return NextResponse.json({ success: true, token: invite.token });
}
