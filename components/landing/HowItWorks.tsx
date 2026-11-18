"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { Check, Droplet, Smartphone } from "lucide-react";
import { Reveal } from "@/components/landing/Reveal";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    title: "Join a Pod",
    body: "Open an invite link from a friend, a church group or your office. No download needed. Add it to your home screen to get alerts.",
  },
  {
    title: "Tell us the basics",
    body: "Add your blood type, when you last donated and where you are. You choose to be contacted for emergencies, and you can change that any time.",
  },
  {
    title: "Answer when it counts",
    body: "When someone needs your blood type, you get an alert with the hospital and time window. Say Yes and they see your name and number. Say No and nothing is shared.",
  },
];

const STEP_MS = 5500;
const TYPES = ["O−", "O+", "A−", "A+", "B−", "B+", "AB−", "AB+"];

function JoinPanel() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-raised">
        <p className="text-[11px] font-bold uppercase tracking-[2px] text-red">You&apos;re invited</p>
        <p className="mt-2 text-base font-extrabold text-ink">Join the Example Church Pod</p>
        <p className="mt-1 text-xs text-ink-muted">14 members · Accra</p>
        <span className="mt-4 block rounded-full bg-red py-3 text-center text-sm font-bold text-white">
          Join this Pod
        </span>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-red-mid bg-red-light/60 p-4">
        <Smartphone className="size-5 shrink-0 text-red" />
        <p className="text-xs leading-snug text-ink-mid">
          <span className="font-bold text-ink">Add to Home Screen</span> so alerts reach you.
        </p>
      </div>
    </div>
  );
}

function BasicsPanel() {
  return (
    <div className="space-y-4 rounded-2xl bg-white p-5 shadow-raised">
      <div>
        <p className="text-xs font-bold text-ink">Blood type</p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {TYPES.map((t) => (
            <span
              key={t}
              className={cn(
                "rounded-xl border py-2 text-center text-xs font-bold",
                t === "O−" ? "border-red bg-red text-white" : "border-hairline text-ink-mid",
              )}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between border-t-[0.5px] border-hairline pt-4 text-xs">
        <span className="text-ink-muted">Last donation</span>
        <span className="font-semibold text-ink">4 months ago</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="max-w-[70%] text-ink-muted">Contact me for emergencies near me</span>
        <span className="flex h-5 w-9 items-center justify-end rounded-full bg-red px-0.5">
          <span className="size-4 rounded-full bg-white" />
        </span>
      </div>
    </div>
  );
}

function AlertPanel() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-raised">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-red text-base font-extrabold text-white">
          O−
        </span>
        <div>
          <p className="text-sm font-extrabold text-ink">Blood needed</p>
          <p className="text-xs text-ink-muted">Example Hospital · within 2 hours</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <span className="rounded-full bg-red py-2.5 text-center text-sm font-bold text-white">Yes, I can</span>
        <span className="rounded-full border border-hairline py-2.5 text-center text-sm font-bold text-ink-mid">No</span>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-muted">
        <Check className="size-3.5 text-[#34C759]" /> Nothing is shared unless you say Yes
      </p>
    </div>
  );
}

const PANELS = [JoinPanel, BasicsPanel, AlertPanel];

export function HowItWorks() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    if (reduce || manual) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % STEPS.length), STEP_MS);
    return () => clearTimeout(t);
  }, [active, manual, reduce]);

  const Panel = PANELS[active];

  return (
    <section id="how-it-works" className="px-6 py-24">
      <div className="mx-auto max-w-[1100px]">
        <Reveal className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[2.5px] text-red">How it works</p>
          <h2 className="mt-4 text-[32px] font-extrabold tracking-[-1px] text-ink lg:text-[40px]">
            Ready in three steps.
          </h2>
        </Reveal>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div role="tablist" aria-label="How BloodPod works" className="flex flex-col gap-3">
            {STEPS.map((s, i) => {
              const on = i === active;
              return (
                <button
                  key={s.title}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => {
                    setManual(true);
                    setActive(i);
                  }}
                  className={cn(
                    "relative overflow-hidden rounded-card border-[0.5px] p-6 text-left transition-all duration-200",
                    on
                      ? "border-red-mid bg-white shadow-raised"
                      : "border-[#E5E5EA] bg-transparent hover:bg-white",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full text-xs font-bold",
                        on ? "bg-red text-white" : "bg-surface text-ink-muted",
                      )}
                    >
                      {i + 1}
                    </span>
                    <h3 className="text-lg font-bold text-ink">{s.title}</h3>
                  </div>
                  <AnimatePresence initial={false}>
                    {on && (
                      <m.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden pl-10 pt-2 text-sm leading-[1.7] text-ink-mid"
                      >
                        {s.body}
                      </m.p>
                    )}
                  </AnimatePresence>
                  {on && !manual && !reduce && (
                    <m.span
                      key={`bar-${active}`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: STEP_MS / 1000, ease: "linear" }}
                      className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-red"
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="relative mx-auto w-full max-w-[380px]">
            <div className="absolute inset-0 -z-10 rounded-[40px] bg-red-light blur-2xl" />
            <div className="rounded-[32px] border border-[#E5E5EA] bg-surface p-5">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-md bg-red">
                  <Droplet className="size-3.5 text-white" />
                </span>
                <span className="text-xs font-bold text-ink">BloodPod</span>
              </div>
              <div className="min-h-[250px]">
                <AnimatePresence mode="wait">
                  <m.div
                    key={active}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Panel />
                  </m.div>
                </AnimatePresence>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-ink-muted">Example screens</p>
          </div>
        </div>
      </div>
    </section>
  );
}
