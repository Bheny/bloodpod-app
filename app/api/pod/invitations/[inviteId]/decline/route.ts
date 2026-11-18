import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";

/** Turns down an invite that was addressed to the signed-in user's email. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ inviteId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { inviteId } = await params;
  const invite = await prisma.podInvite.findUnique({ where: { id: inviteId } });
  if (
    !invite ||
    invite.kind !== "DIRECT" ||
    !invite.email ||
    invite.email.toLowerCase() !== user.email.toLowerCase()
  ) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.status === "PENDING") {
    await prisma.podInvite.update({ where: { id: invite.id }, data: { status: "DECLINED" } });
  }
  return NextResponse.json({ success: true });
}
