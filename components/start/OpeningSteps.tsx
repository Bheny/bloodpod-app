"use client";

import { m } from "framer-motion";
import { Bell, Check, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { INTENTS, INTENT_UNSURE, toolsFor } from "@/lib/intents";
import { cn } from "@/lib/utils";

const BENEFITS = [
  { icon: Bell, title: "Hear first when blood is needed", body: "If your type is needed near you, you get an alert on your phone." },
  { icon: Users, title: "Bring the people you trust", body: "Your church, office, school or family in one Pod, ready to answer together." },
  { icon: ShieldCheck, title: "Stay in control", body: "Say No any time. Your number is shared only when you say Yes." },
];

/** First screen: the goal, and one button. */
export function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <m.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-[30px] font-extrabold leading-[1.12] tracking-[-1px] text-ink lg:text-[34px]"
        >
          Build your emergency contact for when you need it.
        </m.h1>
        <m.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-3 text-body-sm text-ink-muted"
        >
          A circle of people who will answer when blood is needed. It takes about two minutes.
        </m.p>

        <ul className="mt-7 space-y-3">
          {BENEFITS.map((b, i) => (
            <m.li
              key={b.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex gap-3 rounded-card border-[0.5px] border-hairline bg-card p-4"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-light">
                <b.icon className="size-[18px] text-red-fg" />
              </span>
              <span>
                <span className="block text-sm font-bold text-ink">{b.title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">{b.body}</span>
              </span>
            </m.li>
          ))}
        </ul>
      </div>
      <Button onClick={onNext} size="lg" className="mt-4 w-full shrink-0">
        Begin
      </Button>
    </>
  );
}

/** Second screen: what matters to them. Pick as many as they like. */
export function IntentStep({
  chosen,
  onChange,
  onNext,
}: {
  chosen: string[];
  onChange: (next: string[]) => void;
  onNext: () => void;
}) {
  function toggle(id: string) {
    if (id === INTENT_UNSURE) {
      onChange(chosen.includes(INTENT_UNSURE) ? [] : [INTENT_UNSURE]);
      return;
    }
    const without = chosen.filter((c) => c !== INTENT_UNSURE);
    onChange(without.includes(id) ? without.filter((c) => c !== id) : [...without, id]);
  }

  const options = [...INTENTS.map((i) => ({ id: i.id as string, label: i.label as string })), { id: INTENT_UNSURE, label: "I'm not sure yet" }];

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <h1 className="text-[26px] font-extrabold leading-[1.15] tracking-[-0.8px] text-ink">
          What feels important to take care of now?
        </h1>
        <p className="mt-2 text-sm text-ink-muted">Pick as many as you like. There are no wrong answers.</p>

        <div className="mt-5 flex flex-col gap-2" role="group" aria-label="What feels important to you">
          {options.map((o) => {
            const on = chosen.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(o.id)}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-xl border-[1.5px] px-4 py-3 text-left text-sm font-semibold transition-colors",
                  on ? "border-red bg-red-light text-red-fg" : "border-hairline bg-card text-ink hover:border-red-mid",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-md border-[1.5px] transition-colors",
                    on ? "border-red bg-red text-white" : "border-ink-faint/60",
                  )}
                  aria-hidden
                >
                  {on && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                {o.label}
              </button>
            );
          })}
        </div>
      </div>
      <Button onClick={onNext} disabled={chosen.length === 0} size="lg" className="mt-4 w-full shrink-0">
        Continue
      </Button>
    </>
  );
}

/** Third screen: they have already started fixing what they came to fix. */
export function AffirmStep({ chosen, onNext }: { chosen: string[]; onNext: () => void }) {
  const tools = toolsFor(chosen);
  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <m.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 14 }}
          className="flex size-12 items-center justify-center rounded-full bg-success-soft"
        >
          <Check className="size-6 text-[#1FA855]" strokeWidth={3} />
        </m.span>

        <h1 className="mt-5 text-[26px] font-extrabold leading-[1.15] tracking-[-0.8px] text-ink">
          That was the first step in the right direction.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-mid">
          Most people only think about blood when it is already an emergency. You are thinking about it now, while there
          is still time. That is what protects your peace.
        </p>

        <p className="mt-6 text-label font-bold uppercase tracking-[2px] text-red-fg">What we will set up with you</p>
        <ul className="mt-3 space-y-2.5">
          {tools.map((t, i) => (
            <m.li
              key={t}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.12 }}
              className="flex items-start gap-3 rounded-card bg-surface px-4 py-3 text-sm font-semibold text-ink"
            >
              <Check className="mt-0.5 size-4 shrink-0 text-red-fg" strokeWidth={3} aria-hidden />
              {t}
            </m.li>
          ))}
        </ul>

        <p className="mt-5 text-xs text-ink-muted">Next, three quick questions so your network knows how to reach you.</p>
      </div>
      <Button onClick={onNext} size="lg" className="mt-4 w-full shrink-0">
        Continue
      </Button>
    </>
  );
}
