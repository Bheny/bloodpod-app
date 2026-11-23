"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import type { BloodType } from "@prisma/client";
import { Step1Welcome } from "@/components/onboarding/steps/Step1Welcome";
import { Step2BloodType } from "@/components/onboarding/steps/Step2BloodType";
import { Step3Details } from "@/components/onboarding/steps/Step3Details";
import { Step6Location } from "@/components/onboarding/steps/Step6Location";
import { Step5Consent } from "@/components/onboarding/steps/Step5Consent";
import { PodStep } from "@/components/onboarding/steps/PodStep";
import { Step7Alerts } from "@/components/onboarding/steps/Step7Alerts";

export interface OnboardingShellProps {
  initialStep: number;
  name: string | null;
  bloodType: BloodType | null;
  podName: string;
  podId: string | null;
  inviteUrl: string;
  inviteCode: string;
  /** Steps whose answers we already have, so they are skipped. */
  skip: number[];
  needPhone: boolean;
  needDonation: boolean;
}

// 1 welcome, 2 blood type, 3 details, 4 location, 5 consent, 6 pod, 7 alerts.
// Progress dots cover the steps that are actually shown; the welcome screen shows none.

export function OnboardingShell(props: OnboardingShellProps) {
  const [step, setStep] = useState(props.initialStep);
  const [bloodType, setBloodType] = useState<BloodType | null>(props.bloodType);
  const [podName, setPodName] = useState(props.podName);
  const [podId, setPodId] = useState(props.podId);

  const firstName = props.name?.split(" ")[0] ?? null;

  const skipped = props.skip;

  const advance = useCallback(
    (completedStep: number) => {
      fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: completedStep }),
      }).catch(() => {
        // never block onboarding progress on a network hiccup
      });
      let next = completedStep + 1;
      while (next < 7 && skipped.includes(next)) next++;
      setStep(next);
    },
    [skipped],
  );

  const goBack = useCallback(() => {
    setStep((s) => {
      let prev = s - 1;
      while (prev > 1 && skipped.includes(prev)) prev--;
      // The welcome screen is only a way in, never somewhere to go back to when skipped.
      return skipped.includes(prev) ? s : Math.max(1, prev);
    });
  }, [skipped]);

  const visible = [2, 3, 4, 5, 6, 7].filter((n) => !skipped.includes(n));
  const dotCount = visible.length;
  const dotPosition = visible.indexOf(step) + 1;
  const showDots = dotPosition > 0;
  const showBack = dotPosition > 1 || (dotPosition === 1 && !skipped.includes(1));

  return (
    <div className="lg:flex lg:min-h-dvh lg:items-center lg:justify-center lg:px-6 lg:py-8">
    <div className="relative mx-auto flex h-dvh w-full max-w-[480px] flex-col lg:h-[min(760px,calc(100dvh-4rem))] lg:max-w-[520px] lg:overflow-hidden lg:rounded-3xl lg:border-[0.5px] lg:border-hairline lg:bg-card lg:shadow-floating">
      {showDots && (
        <div
          className="absolute inset-x-0 top-3 z-10 flex justify-center gap-1.5"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={dotCount}
          aria-valuenow={dotPosition}
          aria-label={`Step ${dotPosition} of ${dotCount}`}
        >
          {Array.from({ length: dotCount }, (_, i) => i + 1).map((dot) => (
            <span
              key={dot}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: dot === dotPosition ? 18 : 6,
                backgroundColor:
                  dot < dotPosition ? "rgba(221,0,0,0.4)" : dot === dotPosition ? "#DD0000" : "var(--color-hairline)",
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
          className="flex min-h-0 flex-1 flex-col pt-12"
        >
          {step === 1 && <Step1Welcome name={props.name} onNext={() => advance(1)} />}

          {step === 2 && (
            <Step2BloodType value={bloodType} onChange={setBloodType} onNext={() => advance(2)} />
          )}

          {step === 3 && (
            <Step3Details needPhone={props.needPhone} needDonation={props.needDonation} onNext={() => advance(3)} />
          )}

          {step === 4 && <Step6Location onLocated={() => {}} onNext={() => advance(4)} />}

          {step === 5 && <Step5Consent onNext={() => advance(5)} />}

          {step === 6 && (
            <PodStep
              defaultName={podName}
              firstName={firstName}
              bloodType={bloodType}
              podId={podId}
              inviteUrl={props.inviteUrl}
              inviteCode={props.inviteCode}
              onCreated={(id, _slug, name) => {
                setPodId(id);
                setPodName(name);
              }}
              onNext={() => advance(6)}
            />
          )}

          {step === 7 && <Step7Alerts />}
        </m.div>
      </AnimatePresence>
    </div>
    </div>
  );
}
