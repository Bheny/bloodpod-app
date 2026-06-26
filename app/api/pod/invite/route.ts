import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createPodInvite, inviteUrlFor, isValidEmail } from "@/lib/pod-invite";

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

  const pod = await prisma.pod.findUnique({ where: { id: podId } });
  if (!pod || pod.ownerId !== user.id) {
    return NextResponse.json({ error: "Pod not found" }, { status: 404 });
  }

  const invite = await createPodInvite({ podId, senderId: user.id, email });

  // Email delivery (Supabase/Resend) is not wired up yet — the invite record
  // and link are created regardless so the UI can still show it as pending.

  return NextResponse.json({
    success: true,
    token: invite.token,
    inviteUrl: inviteUrlFor(invite.token),
    inviteId: invite.id,
  });
}
