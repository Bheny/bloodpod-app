import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { recalculatePodStrength } from "@/lib/pod-strength";

/**
 * Removes a member from a Pod. The owner can remove anyone but themselves;
 * a member can remove only themselves (that is "leave").
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ podId: string; userId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { podId, userId } = await params;
  const pod = await prisma.pod.findUnique({ where: { id: podId } });
  if (!pod) return NextResponse.json({ error: "Pod not found" }, { status: 404 });

  const isOwner = pod.ownerId === user.id;
  const isSelf = userId === user.id;

  if (userId === pod.ownerId) {
    return NextResponse.json({ error: "The owner can't leave. Delete the Pod instead." }, { status: 409 });
  }
  if (!isOwner && !isSelf) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const membership = await prisma.podMember.findUnique({ where: { podId_userId: { podId, userId } } });
  if (!membership) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  await prisma.podMember.delete({ where: { id: membership.id } });
  await recalculatePodStrength(pod.ownerId);

  return NextResponse.json({ success: true });
}
