"use client";

import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { Check, X } from "lucide-react";
import { Reveal } from "@/components/landing/Reveal";
import { cn } from "@/lib/utils";

const KINDS = [
  { id: "church", label: "Church", pod: "Example Church Pod", names: ["Ama", "Kofi", "Esi", "Yaw", "Abena", "Kwesi"] },
  { id: "office", label: "Office", pod: "Example Office Pod", names: ["Nana", "Efua", "Kojo", "Akua", "Fiifi", "Adwoa"] },
  { id: "school", label: "School", pod: "Example Student Pod", names: ["Kwame", "Maame", "Ebo", "Araba", "Selase", "Dela"] },
  { id: "gym", label: "Gym", pod: "Example Gym Pod", names: ["Samuel", "Gifty", "Joe", "Linda", "Elvis", "Naa"] },
  { id: "family", label: "Family", pod: "Example Family Pod", names: ["Mum", "Dad", "Aunty Pat", "Uncle Ben", "Sis", "Cousin K"] },
];

// Shared demo roster: blood type, eligible?, and what they do when alerted.
const ROSTER = [
  { type: "O−", eligible: true, reply: "yes", at: 1200 },
  { type: "O−", eligible: true, reply: "yes", at: 2600 },
  { type: "A+", eligible: true, reply: null, at: 0 },
  { type: "O−", eligible: true, reply: "no", at: 3600 },
  { type: "B+", eligible: true, reply: null, at: 0 },
  { type: "O−", eligible: false, reply: null, at: 0 },
] as const;

type Phase = "idle" | "sent" | "done";
type Reply = "yes" | "no" | null;

export function PodSection() {
  const [kind, setKind] = useState(KINDS[0]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [replies, setReplies] = useState<Reply[]>(ROSTER.map(() => null));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);

  function reset() {
    clear();
    setPhase("idle");
    setReplies(ROSTER.map(() => null));
  }

  function sendAlert() {
    reset();
    setPhase("sent");
    ROSTER.forEach((r, i) => {
      if (!r.reply) return;
      timers.current.push(
        setTimeout(() => {
          setReplies((prev) => prev.map((v, j) => (j === i ? r.reply : v)));
        }, r.at),
      );
    });
    timers.current.push(setTimeout(() => setPhase("done"), 4400));
  }

  const yesCount = replies.filter((r) => r === "yes").length;

  return (
    <section className="px-6 py-24 lg:px-12">
      <div className="mx-auto grid max-w-[1100px] items-center gap-14 lg:grid-cols-2">
        <Reveal>
          <p className="text-[11px] font-bold uppercase tracking-[2.5px] text-red-fg">Your circle</p>
          <h2 className="mt-4 text-[32px] font-extrabold leading-[1.15] tracking-[-1px] text-ink lg:text-[36px]">
            Your Pod. Your people. Your lifeline.
          </h2>
          <p className="mt-6 text-base leading-[1.7] text-ink-mid">
            A Pod is 10 to 20 people you trust who have agreed to be reachable
            if someone needs blood. Pick a kind of Pod, then send an example
            alert to see what happens.
          </p>
          <p className="mt-4 text-base leading-[1.7] text-ink-mid">
            Only Pod members can see each other. Donors still inside their
            3-month recovery window are never alerted.
          </p>

          <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Kind of Pod">
            {KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                role="tab"
                aria-selected={k.id === kind.id}
                onClick={() => {
                  reset();
                  setKind(k);
                }}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                  k.id === kind.id
                    ? "border-red bg-red text-white"
                    : "border-hairline bg-card text-ink-mid hover:border-red-mid",
                )}
              >
                {k.label}
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.15} className="flex flex-col items-center lg:items-end">
          <div className="w-full max-w-[400px] rounded-card border-[0.5px] border-hairline bg-card p-6 shadow-raised">
            <div className="flex items-center justify-between">
              <p className="font-bold text-ink">{kind.pod}</p>
              <span className="text-xs text-ink-muted">6 of 20</span>
            </div>

            <ul className="mt-4 divide-y-[0.5px] divide-hairline">
              {ROSTER.map((r, i) => {
                const matches = r.type === "O−";
                const reply = replies[i];
                let status = "Ready";
                if (phase !== "idle") {
                  if (!matches) status = "Not a match";
                  else if (!r.eligible) status = "Recovering, not alerted";
                  else if (reply === "yes") status = "Said Yes";
                  else if (reply === "no") status = "Said No";
                  else status = "Alert sent";
                }
                const muted = phase !== "idle" && (!matches || !r.eligible);
                return (
                  <li key={i} className={cn("flex items-center gap-3 py-2.5 transition-opacity", muted && "opacity-50")}>
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full text-[11px] font-bold",
                        matches ? "bg-red-light text-red-fg" : "bg-surface text-ink-muted",
                      )}
                    >
                      {r.type}
                    </span>
                    <span className="flex-1 text-sm font-semibold text-ink">{kind.names[i]}</span>
                    {reply === "yes" && (
                      <m.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <Check className="size-4 text-[#34C759]" />
                      </m.span>
                    )}
                    {reply === "no" && (
                      <m.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <X className="size-4 text-ink-muted" />
                      </m.span>
                    )}
                    <span className="min-w-[120px] text-right text-xs text-ink-muted">{status}</span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-ink-mid" aria-live="polite">
                {phase === "idle" ? "Need O− blood" : `${yesCount} Yes so far`}
              </p>
              {phase === "idle" ? (
                <button
                  type="button"
                  onClick={sendAlert}
                  className="rounded-full bg-red px-4 py-2 text-sm font-bold text-white transition-transform hover:scale-[1.03] active:scale-95"
                >
                  Send example alert
                </button>
              ) : (
                <button
                  type="button"
                  onClick={reset}
                  disabled={phase === "sent"}
                  className="rounded-full border border-hairline px-4 py-2 text-sm font-bold text-ink-mid disabled:opacity-40"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          <p className="mt-3 text-xs text-ink-muted">Example data. Names and replies are made up.</p>
        </Reveal>
      </div>
    </section>
  );
}
