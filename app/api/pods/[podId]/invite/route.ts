import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createPodInvite } from "@/lib/pod-invite";
import { isPodFull } from "@/lib/pod-limits";
import { growSlotsIfEarned } from "@/lib/pod-slots";
import { parsePodCategory } from "@/lib/pod-categories";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ podId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { podId } = await params;
  const { email, category } = (await request.json()) as { email?: string; category?: string };
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
  if (isPodFull(pod._count.members + 1, pod.slotLimit)) {
    const grown = await growSlotsIfEarned(podId);
    if (grown === null || isPodFull(pod._count.members + 1, grown)) {
      return NextResponse.json({ error: "Your Pod is full for now. It gets more room as it grows stronger." }, { status: 409 });
    }
  }

  const invite = await createPodInvite({ podId, senderId: user.id, email, category: parsePodCategory(category) });

  return NextResponse.json({ success: true, token: invite.token });
}
