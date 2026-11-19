import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { getOrCreateShareInvite, inviteUrlFor } from "@/lib/pod-invite";
import { Suspense } from "react";
import { StartFlow } from "@/components/start/StartFlow";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { ImportGate } from "@/components/onboarding/ImportGate";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.hospitalId) redirect("/hospital");
  if (user.labId) redirect("/lab");
  if (user.onboardingComplete) redirect("/dashboard");

  // Every account gets a Pod at sign-up, so there is always one to invite into.
  const pod = await prisma.pod.findFirst({
    where: { ownerId: user.id },
    orderBy: { createdAt: "asc" },
  });
  if (!pod) redirect("/sign-in");

  const shareInvite = await getOrCreateShareInvite(pod.id, user.id);

  // Skip any step whose answer we already have (for example from /start).
  const needPhone = !user.phone;
  const needDonation = !user.donationInfoAt && !user.lastDonated;
  const skip: number[] = [];
  if (user.donationInfoAt) skip.push(1);
  if (user.bloodType) skip.push(2);
  if (!needPhone && !needDonation) skip.push(3);
  if (user.city) skip.push(4);

  let initialStep = Math.min(user.onboardingStep + 1, 7);
  while (initialStep < 7 && skip.includes(initialStep)) initialStep++;

  // Anyone who hasn't given their blood type, last donation and city yet (Google sign-up, or email
  // sign-up that skipped /start) gets the same story and questions as /start, then carries on here.
  const needsAnswers = (!user.bloodType && user.onboardingStep < 2) || !user.city || (!user.donationInfoAt && !user.lastDonated);
  if (needsAnswers) {
    return (
      <ImportGate>
        <Suspense>
          <StartFlow signedIn />
        </Suspense>
      </ImportGate>
    );
  }

  return (
    <ImportGate>
      <OnboardingShell
        initialStep={initialStep}
        name={user.name}
        bloodType={user.bloodType}
        podName={pod.name}
        podId={pod.id}
        inviteUrl={inviteUrlFor(shareInvite.token)}
        inviteCode={shareInvite.code}
        skip={skip}
        needPhone={needPhone}
        needDonation={needDonation}
      />
    </ImportGate>
  );
}
