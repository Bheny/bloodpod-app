import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";

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

  return NextResponse.json({ success: true, nextStep: onboardingComplete ? step : step + 1 });
}
