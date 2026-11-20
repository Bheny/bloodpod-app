import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { emailWelcome } from "@/lib/email/notify";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { step } = (await request.json()) as { step?: number };
  if (typeof step !== "number" || step < 1 || step > 7) {
    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  }

  const onboardingComplete = step === 7;

  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingStep: step, onboardingComplete },
  });

  // Only the first time they finish. The idempotency key backs this up if the request is retried.
  if (onboardingComplete && !user.onboardingComplete && user.email) {
    emailWelcome({ to: user.email, userId: user.id, name: user.name, bloodType: user.bloodType ? BLOOD_TYPE_LABELS[user.bloodType] : null });
  }

  return NextResponse.json({ success: true, nextStep: onboardingComplete ? step : step + 1 });
}
