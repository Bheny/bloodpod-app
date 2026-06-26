import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { donationSchema } from "@/lib/validations/donation";
import { calculateStreak, nextEligibleDate } from "@/lib/passport";
import { recalculatePodStrength } from "@/lib/pod-strength";
import { logActivity } from "@/lib/activity";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = donationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 },
    );
  }
  const { facility, donatedAt, bloodType, verified, notes } = parsed.data;
  const previousTier = user.passportTier;

  const donation = await prisma.donation.create({
    data: { userId: user.id, facility, donatedAt: new Date(donatedAt), bloodType, verified, notes },
  });

  const donations = await prisma.donation.findMany({ where: { userId: user.id } });
  const streak = calculateStreak(donations);
  const lastDonated = donations.reduce(
    (latest, d) => (d.donatedAt > latest ? d.donatedAt : latest),
    donations[0].donatedAt,
  );
  const nextEligible = nextEligibleDate(lastDonated);

  await prisma.user.update({
    where: { id: user.id },
    data: { bloodType, lastDonated, nextEligible, donationStreak: streak, lastStreakDate: new Date() },
  });

  const { score: podStrengthScore } = await recalculatePodStrength(user.id);
  const updatedUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  const tierUpgraded = updatedUser.passportTier !== previousTier;

  await logActivity(
    user.id,
    "DONATION_LOGGED",
    `Logged a donation at ${facility}`,
    `Donation #${donations.length}`,
  );

  return NextResponse.json({
    success: true,
    donation,
    newCount: donations.length,
    newTier: updatedUser.passportTier,
    tierUpgraded,
    streak,
    nextEligible,
    podStrengthScore,
  });
}
