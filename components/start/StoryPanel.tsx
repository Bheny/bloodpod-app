"use client";

import { m } from "framer-motion";
import { LogoMark } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const PLOTS = 10;

/** Plots filled in the garden at each screen: it grows as they answer. */
const FILLED = [1, 2, 3, 4, 6, 8, 10];

const LINES = [
  { title: "Your people, ready before you need them.", body: "Ten to twenty people you trust, who answer when blood is needed." },
  { title: "Start from what matters to you.", body: "This only helps us begin in the right place. You can change it any time." },
  { title: "You have already begun.", body: "A little preparation now is worth a great deal on the day it counts." },
  { title: "Your blood type decides who you can help.", body: "Hospitals match on it, so your circle knows who covers what." },
  { title: "Your donations keep everyone safe.", body: "We never ask you to give before your body is ready." },
  { title: "Close by is faster.", body: "Requests near you reach you first. We never track you." },
  { title: "You are the first one in.", body: "Next, bring the people you trust and the garden fills." },
];

/** The left side of the sign-up card on a wide screen. Phones never see it. */
export function StoryPanel({ step }: { step: number }) {
  const line = LINES[Math.min(step, LINES.length - 1)];
  const filled = FILLED[Math.min(step, FILLED.length - 1)];

  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-red p-10 text-white lg:flex" aria-hidden>
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-white">
          <LogoMark className="size-6" />
        </span>
        <span className="text-lg font-extrabold tracking-tight">BloodPod</span>
      </div>

      <div>
        <m.div
          key={step}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-[30px] font-extrabold leading-[1.12] tracking-[-1px]">{line.title}</h2>
          <p className="mt-3 max-w-xs text-body-sm leading-relaxed text-white/80">{line.body}</p>
        </m.div>

        <div className="mt-8 grid grid-cols-5 gap-3">
          {Array.from({ length: PLOTS }, (_, i) => {
            const on = i < filled;
            return (
              <m.span
                key={i}
                initial={false}
                animate={{ scale: on ? 1 : 0.9, opacity: on ? 1 : 0.55 }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: on ? i * 0.04 : 0 }}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-full text-label font-bold",
                  on ? "bg-white text-red" : "border-[1.5px] border-dashed border-white/60",
                )}
              >
                {i === 0 && on ? "You" : ""}
              </m.span>
            );
          })}
        </div>
      </div>

      {/* Soft shapes so the panel is not a flat block of colour. */}
      <span className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-white/[0.06]" />
      <span className="pointer-events-none absolute -bottom-32 -left-20 size-80 rounded-full bg-black/[0.08]" />
    </aside>
  );
}
