"use client";

import { useState } from "react";
import type { BloodType } from "@prisma/client";
import { Step3PodName } from "@/components/onboarding/steps/Step3PodName";
import { Step5Invite } from "@/components/onboarding/steps/Step5Invite";

// Naming the Pod and inviting the first member are one step in the progress bar.
export function PodStep({
  defaultName,
  firstName,
  bloodType,
  podId,
  inviteUrl,
  inviteCode,
  onCreated,
  onNext,
}: {
  defaultName: string;
  firstName: string | null;
  bloodType: BloodType | null;
  podId: string | null;
  inviteUrl: string;
  inviteCode: string;
  onCreated: (podId: string, slug: string, name: string) => void;
  onNext: () => void;
}) {
  const [phase, setPhase] = useState<"name" | "invite">("name");

  return phase === "name" ? (
    <Step3PodName
      defaultName={defaultName}
      firstName={firstName}
      bloodType={bloodType}
      onCreated={onCreated}
      onNext={() => setPhase("invite")}
    />
  ) : (
    <Step5Invite podId={podId} inviteUrl={inviteUrl} inviteCode={inviteCode} onNext={onNext} />
  );
}
