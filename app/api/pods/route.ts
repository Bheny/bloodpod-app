import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { slugify } from "@/lib/slugify";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = (await request.json()) as { name?: string };
  const trimmed = (name ?? "").trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Pod name is required" }, { status: 400 });
  }

  const existingPod = await prisma.pod.findFirst({
    where: { ownerId: user.id },
    orderBy: { createdAt: "asc" },
  });

  const baseSlug = slugify(trimmed);
  let slug = baseSlug;
  let suffix = 1;
  while (true) {
    const clash = await prisma.pod.findUnique({ where: { slug } });
    if (!clash || clash.id === existingPod?.id) break;
    slug = `${baseSlug}-${suffix++}`;
  }

  try {
    const pod = existingPod
      ? await prisma.pod.update({ where: { id: existingPod.id }, data: { name: trimmed, slug } })
      : await prisma.pod.create({ data: { name: trimmed, slug, ownerId: user.id } });
    return NextResponse.json({ podId: pod.id, slug: pod.slug });
  } catch (e) {
    // Two requests at once: the database allows one Pod per owner, so rename the one that won.
    if (!existingPod && e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const won = await prisma.pod.findFirst({ where: { ownerId: user.id }, orderBy: { createdAt: "asc" } });
      if (won) {
        const pod = await prisma.pod.update({ where: { id: won.id }, data: { name: trimmed } });
        return NextResponse.json({ podId: pod.id, slug: pod.slug });
      }
    }
    throw e;
  }
}
