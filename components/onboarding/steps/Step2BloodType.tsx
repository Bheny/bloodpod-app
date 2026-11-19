"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import type { BloodType } from "@prisma/client";
import { cn } from "@/lib/utils";
import { BloodTypeHelp } from "@/components/shared/BloodTypeHelp";
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
  const [unknown, setUnknown] = useState(false);
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
    setUnknown(false);
    onChange(type);
  }

  function toggleUnknown() {
    onChange(null);
    setUnknown((u) => !u);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col px-6 py-6">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="text-[11px] font-bold uppercase tracking-[2px] text-red-fg">
          Your blood type
        </p>
        <h1 className="mt-3 text-[22px] font-extrabold tracking-[-0.6px] text-ink">
          What&apos;s your blood type?
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Hospitals match on this, so it is the most important thing we ask.
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
                    ? "border-red bg-red-light text-red-fg"
                    : "border-hairline bg-card text-ink hover:border-red-mid",
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

        <button
          type="button"
          aria-pressed={unknown}
          onClick={toggleUnknown}
          className={cn(
            "mt-3 w-full rounded-xl border-[1.5px] px-4 py-3 text-center text-sm font-semibold transition-colors",
            unknown ? "border-red bg-red-light text-red-fg" : "border-hairline bg-card text-ink hover:border-red-mid",
          )}
        >
          I don&apos;t know my blood type
        </button>
        {unknown && (
          <div className="mt-4">
            <BloodTypeHelp signedIn />
          </div>
        )}
      </div>

      <Button
        onClick={() => (value ? saveBloodType(value) : onNext())}
        disabled={!value && !unknown}
        loading={saving}
        size="lg"
        className="mt-4 w-full shrink-0"
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
              className="mb-0 w-full max-w-[440px] rounded-t-3xl bg-card p-8 text-center shadow-[0_-8px_40px_rgba(0,0,0,0.1)]"
            >
              <p className="text-2xl">🩸</p>
              <h2 className="mt-3 text-xl font-extrabold tracking-[-0.5px] text-ink">
                You&apos;re a universal donor.
              </h2>
              <p className="mt-2 text-sm leading-[1.6] text-ink-muted">
                O− blood can be given to almost anyone in an emergency, so
                your Pod will be glad to have you.
              </p>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
