import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPodAllowance } from "@/lib/pod-access";
import { slugify } from "@/lib/slugify";

/** Creates an additional Pod (the first one is made during onboarding by /api/pods). */
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
    return NextResponse.json(
      { error: `You can own up to ${allowance.limit} Pods. Delete one, or upgrade for more.` },
      { status: 402 },
    );
  }

  const baseSlug = slugify(trimmed);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.pod.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const pod = await prisma.pod.create({ data: { name: trimmed, slug, ownerId: user.id } });
  return NextResponse.json({ podId: pod.id, slug: pod.slug });
}
