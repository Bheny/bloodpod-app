import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { hospitalApplicationSchema } from "@/lib/validations/hospital";
import { normalizeGhanaAnyNumber } from "@/lib/phone";
import { emailAdmins, emailHospitalReceived } from "@/lib/email/notify";
import { appUrl } from "@/lib/email/send";

// Creates the Hospital (status PENDING) and links the signed-in account to it.
// The account itself is created by Supabase sign-up on the client, so the
// identity here always comes from the session, never from the request body.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json(
      { error: "Your account needs confirming first. Check your email, then sign in to finish applying." },
      { status: 401 },
    );
  }

  const parsed = hospitalApplicationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid application" }, { status: 400 });
  }
  const v = parsed.data;

  const existing = await prisma.user.findUnique({ where: { supabaseId: data.user.id } });
  if (existing?.hospitalId) return NextResponse.json({ success: true });

  const hospitalId = await prisma.$transaction(async (tx) => {
    const hospital = await tx.hospital.create({
      data: {
        name: v.facilityName,
        kind: v.kind,
        city: v.city,
        address: v.address,
        phone: normalizeGhanaAnyNumber(v.facilityPhone)!,
        note: v.note || null,
      },
    });

    const link = { hospitalId: hospital.id, jobTitle: v.jobTitle, name: v.name, onboardingComplete: true };
    if (existing) {
      await tx.user.update({ where: { id: existing.id }, data: link });
    } else {
      await tx.user.create({
        data: { supabaseId: data.user.id, email: data.user.email ?? v.email, ...link },
      });
    }
    return hospital.id;
  });

  const to = data.user.email ?? v.email;
  if (to) emailHospitalReceived({ to, hospitalId, name: v.name, hospitalName: v.facilityName });
  emailAdmins({
    key: `hospital-apply/${hospitalId}`,
    subject: `New hospital application: ${v.facilityName}`,
    lines: [`${v.facilityName} in ${v.city} applied. Contact: ${v.name}, ${v.jobTitle}.`],
    cta: { label: "Review it", url: appUrl("/admin/hospitals") },
  });

  return NextResponse.json({ success: true });
}
