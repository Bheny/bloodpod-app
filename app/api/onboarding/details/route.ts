import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { detailsSchema } from "@/lib/validations/onboarding";
import { normalizeGhanaPhone } from "@/lib/phone";
import { computeEligibility } from "@/lib/eligibility";

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = detailsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid details" }, { status: 400 });
  }
  const { phone, neverDonated, lastDonated } = parsed.data;

  const data: Parameters<typeof prisma.user.update>[0]["data"] = {};

  if (phone) {
    data.phone = normalizeGhanaPhone(phone)!;
  } else if (!user.phone) {
    return NextResponse.json({ error: "Enter your mobile number" }, { status: 400 });
  }

  // Only touch donation info when the step actually asked for it.
  if (neverDonated !== undefined || lastDonated) {
    let donated: Date | null = null;
    if (!neverDonated) {
      if (!lastDonated) return NextResponse.json({ error: "Enter your last donation date" }, { status: 400 });
      donated = new Date(lastDonated);
      if (donated.getTime() > Date.now()) {
        return NextResponse.json({ error: "That date is in the future" }, { status: 400 });
      }
    }
    const { nextEligible, isEligible } = computeEligibility(donated);
    data.lastDonated = donated;
    data.nextEligible = nextEligible;
    data.isEligible = isEligible;
    data.donationInfoAt = new Date();
  }

  await prisma.user.update({ where: { id: user.id }, data });
  return NextResponse.json({ success: true });
}
