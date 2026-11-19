import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { slugify } from "@/lib/slugify";

async function ownedPod(podId: string, userId: string) {
  const pod = await prisma.pod.findUnique({ where: { id: podId } });
  return pod && pod.ownerId === userId ? pod : null;
}

/** Rename a Pod you own. */
export async function PATCH(request: Request, { params }: { params: Promise<{ podId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { podId } = await params;
  const pod = await ownedPod(podId, user.id);
  if (!pod) return NextResponse.json({ error: "Pod not found" }, { status: 404 });

  const { name } = (await request.json()) as { name?: string };
  const trimmed = (name ?? "").trim().slice(0, 60);
  if (trimmed.length < 2) {
    return NextResponse.json({ error: "Give your Pod a name (at least 2 characters)." }, { status: 400 });
  }

  const baseSlug = slugify(trimmed);
  let slug = baseSlug;
  let suffix = 1;
  while (true) {
    const clash = await prisma.pod.findUnique({ where: { slug } });
    if (!clash || clash.id === pod.id) break;
    slug = `${baseSlug}-${suffix++}`;
  }

  await prisma.pod.update({ where: { id: pod.id }, data: { name: trimmed, slug } });
  return NextResponse.json({ success: true });
}

/** Delete a Pod you own, along with its memberships and invites. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ podId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { podId } = await params;
  const pod = await ownedPod(podId, user.id);
  if (!pod) return NextResponse.json({ error: "Pod not found" }, { status: 404 });

  const owned = await prisma.pod.count({ where: { ownerId: user.id } });
  if (owned <= 1) {
    return NextResponse.json({ error: "This is your only Pod. Rename it instead of deleting it." }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.careProfile.updateMany({ where: { podId: pod.id }, data: { podId: null } }),
    prisma.podInvite.deleteMany({ where: { podId: pod.id } }),
    prisma.podMember.deleteMany({ where: { podId: pod.id } }),
    prisma.pod.delete({ where: { id: pod.id } }),
  ]);

  return NextResponse.json({ success: true });
}
