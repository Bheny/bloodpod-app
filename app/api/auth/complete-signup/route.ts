import { NextResponse } from "next/server";
import { BloodType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function slugify(input: string) {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);
  return slug || "pod";
}

function isBloodType(value: string): value is BloodType {
  return (Object.values(BloodType) as string[]).includes(value);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { supabaseId, email, name, bloodType } = body as {
    supabaseId?: string;
    email?: string;
    name?: string;
    bloodType?: string;
  };

  if (!supabaseId || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { supabaseId } });
  if (existing) {
    return NextResponse.json({ user: existing });
  }

  const baseSlug = slugify(name || email.split("@")[0]);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.pod.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const user = await prisma.user.create({
    data: {
      supabaseId,
      email,
      name,
      bloodType: bloodType && isBloodType(bloodType) ? bloodType : undefined,
      ownedPods: {
        create: {
          name: name ? `${name.split(" ")[0]}'s Pod` : "My Pod",
          slug,
        },
      },
    },
  });

  return NextResponse.json({ user });
}
