import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.onboardingComplete) redirect("/dashboard");

  const pod = await prisma.pod.findFirst({
    where: { ownerId: user.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <OnboardingShell
      initialStep={Math.min(user.onboardingStep + 1, 7)}
      name={user.name}
      bloodType={user.bloodType}
      podName={pod?.name ?? (user.name ? `${user.name.split(" ")[0]}'s Pod` : "My Pod")}
      podId={pod?.id ?? null}
      podSlug={pod?.slug ?? null}
    />
  );
}
