"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { Check, Droplet } from "lucide-react";

// 0 lock screen, 1 push arrives, 2 alert opened, 3 answered Yes
const STEP_MS = [1800, 2400, 2800, 3600];

export function PhoneDemo() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % STEP_MS.length), STEP_MS[step]);
    return () => clearTimeout(t);
  }, [step, reduce]);

  // Reduced motion: hold on the alert screen instead of looping.
  const shown = reduce ? 2 : step;

  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px]">
      <div className="rounded-[44px] border-[6px] border-ink bg-panel p-0 shadow-[0_40px_80px_-20px_rgba(28,28,30,0.45)]">
        <div className="relative h-[560px] overflow-hidden rounded-[38px] bg-surface">
          <div className="absolute left-1/2 top-2.5 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-panel" />

          <AnimatePresence mode="wait">
            {shown < 2 ? (
              <m.div
                key="lock"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 flex flex-col bg-gradient-to-b from-ink to-[#2c2c30] px-4 pt-16 text-white"
              >
                <p className="text-center text-[56px] font-light leading-none tracking-tight">9:41</p>
                <p className="mt-2 text-center text-xs text-white/60">Tuesday</p>

                <AnimatePresence>
                  {shown === 1 && (
                    <m.div
                      initial={{ y: -30, opacity: 0, scale: 0.96 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 22 }}
                      className="mt-10 rounded-2xl bg-white/15 p-3.5 backdrop-blur-md"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex size-5 items-center justify-center rounded-md bg-red">
                          <Droplet className="size-3 text-white" />
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
                          BloodPod
                        </span>
                        <span className="ml-auto text-[11px] text-white/50">now</span>
                      </div>
                      <p className="mt-2 text-[13px] font-bold">O negative needed</p>
                      <p className="text-[12px] text-white/75">Example Hospital, within 2 hours</p>
                    </m.div>
                  )}
                </AnimatePresence>
              </m.div>
            ) : (
              <m.div
                key="app"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex flex-col px-5 pt-14"
              >
                <p className="text-[11px] font-bold uppercase tracking-[2px] text-red-fg">
                  Emergency alert
                </p>

                <div className="mt-3 rounded-2xl bg-card p-4 shadow-raised">
                  <div className="flex items-center gap-3">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-red text-lg font-extrabold text-white">
                      O−
                    </span>
                    <div>
                      <p className="text-sm font-extrabold text-ink">Blood needed</p>
                      <p className="text-xs text-ink-muted">Example Hospital</p>
                    </div>
                  </div>
                  <dl className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-ink-muted">Time window</dt>
                      <dd className="font-semibold text-ink">Within 2 hours</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-ink-muted">You are</dt>
                      <dd className="font-semibold text-ink">Eligible to donate</dd>
                    </div>
                  </dl>
                </div>

                <AnimatePresence mode="wait">
                  {shown === 2 ? (
                    <m.div
                      key="choices"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="mt-5 grid grid-cols-2 gap-3"
                    >
                      <span className="rounded-full bg-red py-3 text-center text-sm font-bold text-white">
                        Yes, I can
                      </span>
                      <span className="rounded-full border border-hairline bg-card py-3 text-center text-sm font-bold text-ink-mid">
                        No
                      </span>
                    </m.div>
                  ) : (
                    <m.div
                      key="done"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="mt-5 rounded-2xl bg-card p-4 text-center shadow-raised"
                    >
                      <span className="mx-auto flex size-9 items-center justify-center rounded-full bg-[#34C759]">
                        <Check className="size-5 text-white" />
                      </span>
                      <p className="mt-2 text-sm font-extrabold text-ink">Thank you</p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-mid">
                        The hospital can now see your name and number.
                      </p>
                    </m.div>
                  )}
                </AnimatePresence>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-ink-muted">Example alert, not a real emergency</p>
    </div>
  );
}
