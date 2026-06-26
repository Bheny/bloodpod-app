import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createPodInvite } from "@/lib/pod-invite";

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

  const pod = await prisma.pod.findUnique({ where: { id: podId } });
  if (!pod || pod.ownerId !== user.id) {
    return NextResponse.json({ error: "Pod not found" }, { status: 404 });
  }

  const invite = await createPodInvite({ podId, senderId: user.id, email });

  return NextResponse.json({ success: true, token: invite.token });
}
