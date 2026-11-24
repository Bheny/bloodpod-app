import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPodAllowance } from "@/lib/pod-access";
import { slugify } from "@/lib/slugify";

/** Creates a donor's Pod, only if they do not lead one yet. Every donor has one Pod, and it grows by adding people. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = (await request.json()) as { name?: string };
  const trimmed = (name ?? "").trim().slice(0, 60);
  if (trimmed.length < 2) {
    return NextResponse.json({ error: "Give your Pod a name (at least 2 characters)." }, { status: 400 });
  }

  const allowance = await getPodAllowance(user.id);
  if (!allowance.canCreate) {
    const existing = await prisma.pod.findFirst({ where: { ownerId: user.id }, orderBy: { createdAt: "asc" }, select: { id: true } });
    return NextResponse.json({ error: "You already have a Pod. Add people to it instead.", podId: existing?.id }, { status: 409 });
  }

  const baseSlug = slugify(trimmed);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.pod.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  try {
    const pod = await prisma.pod.create({ data: { name: trimmed, slug, ownerId: user.id } });
    return NextResponse.json({ podId: pod.id, slug: pod.slug });
  } catch (e) {
    // Two taps at once: the database allows one Pod per owner, so the second one finds the first.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const existing = await prisma.pod.findFirst({ where: { ownerId: user.id }, select: { id: true, slug: true } });
      if (existing) return NextResponse.json({ podId: existing.id, slug: existing.slug });
    }
    throw e;
  }
}
