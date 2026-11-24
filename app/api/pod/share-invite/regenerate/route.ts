import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { regenerateShareInvite, inviteUrlFor } from "@/lib/pod-invite";
import { parsePodCategory } from "@/lib/pod-categories";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { podId, category } = (await request.json()) as { podId?: string; category?: string };
  if (!podId) {
    return NextResponse.json({ error: "podId is required" }, { status: 400 });
  }

  const pod = await prisma.pod.findUnique({ where: { id: podId } });
  if (!pod || pod.ownerId !== user.id) {
    return NextResponse.json({ error: "Pod not found" }, { status: 404 });
  }

  const invite = await regenerateShareInvite(podId, user.id, parsePodCategory(category));

  return NextResponse.json({
    success: true,
    token: invite.token,
    code: invite.code,
    inviteUrl: inviteUrlFor(invite.token),
  });
}
