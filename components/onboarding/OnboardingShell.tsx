"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import type { BloodType } from "@prisma/client";
import { Step1Hook } from "@/components/onboarding/steps/Step1Hook";
import { Step2BloodType } from "@/components/onboarding/steps/Step2BloodType";
import { Step3PodName } from "@/components/onboarding/steps/Step3PodName";
import { Step4Celebration } from "@/components/onboarding/steps/Step4Celebration";
import { Step5Invite } from "@/components/onboarding/steps/Step5Invite";
import { Step6Location } from "@/components/onboarding/steps/Step6Location";
import { Step7Home } from "@/components/onboarding/steps/Step7Home";

export interface OnboardingShellProps {
  initialStep: number;
  name: string | null;
  bloodType: BloodType | null;
  podName: string;
  podId: string | null;
  podSlug: string | null;
}

// Dot position N (1-5) maps to onboarding step N+1 (steps 2-6).
// Step 1 (hook), step 4 (celebration), and step 7 (bridge) never show dots.
const HIDE_DOTS_ON = [1, 4, 7];
const SHOW_BACK_ON = [2, 3, 5, 6];

export function OnboardingShell(props: OnboardingShellProps) {
  const [step, setStep] = useState(props.initialStep);
  const [bloodType, setBloodType] = useState<BloodType | null>(props.bloodType);
  const [podName, setPodName] = useState(props.podName);
  const [podId, setPodId] = useState(props.podId);
  const [podSlug, setPodSlug] = useState(props.podSlug);
  const [, setCity] = useState<string | null>(null);

  const advance = useCallback((completedStep: number) => {
    fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: completedStep }),
    }).catch(() => {
      // never block onboarding progress on a network hiccup
    });
    setStep(completedStep + 1);
  }, []);

  const goBack = useCallback(() => setStep((s) => Math.max(1, s - 1)), []);

  const dotPosition = step - 1; // step2->1 ... step6->5
  const showDots = !HIDE_DOTS_ON.includes(step);
  const showBack = SHOW_BACK_ON.includes(step);

  return (
    <div className="relative flex min-h-screen flex-col">
      {showDots && (
        <div className="absolute inset-x-0 top-3 z-10 flex justify-center gap-1.5">
          {[1, 2, 3, 4, 5].map((dot) => (
            <span
              key={dot}
              className="size-1.5 rounded-full transition-colors duration-300"
              style={{
                backgroundColor:
                  dot < dotPosition
                    ? "rgba(221,0,0,0.4)"
                    : dot === dotPosition
                      ? "#DD0000"
                      : "#F2F2F2",
              }}
            />
          ))}
        </div>
      )}

      {showBack && (
        <button
          type="button"
          aria-label="Back"
          onClick={goBack}
          className="absolute left-4 top-4 z-10 flex size-9 items-center justify-center rounded-full text-ink-mid hover:bg-surface"
        >
          <ArrowLeft className="size-5" />
        </button>
      )}

      <AnimatePresence mode="wait">
        <m.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-1 flex-col pt-12"
        >
          {step === 1 && <Step1Hook onNext={() => advance(1)} />}

          {step === 2 && (
            <Step2BloodType value={bloodType} onChange={setBloodType} onNext={() => advance(2)} />
          )}

          {step === 3 && (
            <Step3PodName
              defaultName={podName}
              bloodType={bloodType}
              onCreated={(id, slug, name) => {
                setPodId(id);
                setPodSlug(slug);
                setPodName(name);
              }}
              onNext={() => advance(3)}
            />
          )}

          {step === 4 && (
            <Step4Celebration
              name={props.name}
              bloodType={bloodType}
              podName={podName}
              onNext={() => advance(4)}
            />
          )}

          {step === 5 && (
            <Step5Invite podId={podId} podSlug={podSlug} onNext={() => advance(5)} />
          )}

          {step === 6 && <Step6Location onLocated={setCity} onNext={() => advance(6)} />}

          {step === 7 && <Step7Home />}
        </m.div>
      </AnimatePresence>
    </div>
  );
}
