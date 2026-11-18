import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { isBloodType } from "@/lib/blood-type";
import { normalizeGhanaPhone } from "@/lib/phone";

export async function POST(request: Request) {
  const body = await request.json();
  const { supabaseId, email, name, phone, bloodType, avatarUrl } = body as {
    supabaseId?: string;
    email?: string;
    name?: string;
    phone?: string;
    bloodType?: string;
    avatarUrl?: string;
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
      avatarUrl,
      phone: phone ? (normalizeGhanaPhone(phone) ?? undefined) : undefined,
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
