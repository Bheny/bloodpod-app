"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import type { BloodType } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

const OPTIONS: { label: string; value: BloodType; note?: string }[] = [
  { label: "A+", value: "A_POS" },
  { label: "A−", value: "A_NEG" },
  { label: "B+", value: "B_POS" },
  { label: "B−", value: "B_NEG" },
  { label: "O+", value: "O_POS", note: "most needed" },
  { label: "O−", value: "O_NEG", note: "universal donor" },
  { label: "AB+", value: "AB_POS" },
  { label: "AB−", value: "AB_NEG" },
];

export function Step2BloodType({
  value,
  onChange,
  onNext,
}: {
  value: BloodType | null;
  onChange: (value: BloodType | null) => void;
  onNext: () => void;
}) {
  const [showONegMoment, setShowONegMoment] = useState(false);
  const [showSkipTip, setShowSkipTip] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!showONegMoment) return;
    const timer = setTimeout(() => {
      setShowONegMoment(false);
      onNext();
    }, 2500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showONegMoment]);

  useEffect(() => {
    if (!showSkipTip) return;
    const timer = setTimeout(onNext, 1800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSkipTip]);

  async function saveBloodType(bloodType: BloodType) {
    setSaving(true);
    try {
      await fetch("/api/onboarding/blood-type", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bloodType }),
      });
    } catch {
      // never block onboarding progress on a network hiccup
    }
    setSaving(false);

    if (bloodType === "O_NEG") {
      setShowONegMoment(true);
      return;
    }
    onNext();
  }

  function selectType(type: BloodType) {
    onChange(type);
  }

  function skip() {
    onChange(null);
    setShowSkipTip(true);
  }

  return (
    <div className="flex flex-1 flex-col px-6 py-10">
      <div className="flex-1">
        <p className="text-[11px] font-bold uppercase tracking-[2px] text-red">
          Your blood identity
        </p>
        <h1 className="mt-3 text-[22px] font-extrabold tracking-[-0.6px] text-ink">
          What&apos;s your blood type?
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          This is the most important thing on your passport.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {OPTIONS.map((opt) => {
            const selected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => selectType(opt.value)}
                className={cn(
                  "rounded-xl border-[1.5px] py-3 text-center text-base font-bold transition-colors duration-150",
                  selected
                    ? "border-red bg-red-light text-red"
                    : "border-[#E5E5EA] bg-white text-ink hover:border-red-mid",
                )}
              >
                {opt.label}
                {opt.note && (
                  <span className="mt-0.5 block text-[10px] font-medium text-ink-muted">
                    ({opt.note})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={skip}
            disabled={showSkipTip}
            className="text-sm text-ink-faint underline-offset-2 hover:underline disabled:no-underline"
          >
            I don&apos;t know my blood type
          </button>
          {showSkipTip && (
            <p className="mt-2 text-xs text-ink-muted">
              No problem — you can add it later from your profile.
            </p>
          )}
        </div>
      </div>

      <Button
        onClick={() => value && saveBloodType(value)}
        disabled={!value || showSkipTip}
        loading={saving}
        size="lg"
        className="w-full"
      >
        Continue →
      </Button>

      <AnimatePresence>
        {showONegMoment && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-red/[0.04]"
            onClick={() => {
              setShowONegMoment(false);
              onNext();
            }}
          >
            <m.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="mb-0 w-full max-w-[440px] rounded-t-3xl bg-white p-8 text-center shadow-[0_-8px_40px_rgba(0,0,0,0.1)]"
            >
              <p className="text-2xl">🩸</p>
              <h2 className="mt-3 text-xl font-extrabold tracking-[-0.5px] text-ink">
                You&apos;re a universal donor.
              </h2>
              <p className="mt-2 text-sm leading-[1.6] text-ink-muted">
                O− is the rarest and most needed blood type. Every hospital on
                BloodPod needs you.
              </p>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
