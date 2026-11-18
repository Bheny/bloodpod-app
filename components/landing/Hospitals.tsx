"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { Check, Truck } from "lucide-react";
import { Reveal } from "@/components/landing/Reveal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const POINTS = [
  {
    title: "See who is nearby",
    body: "Counts of eligible donors by blood type within a radius of your hospital. No names until a donor says Yes.",
  },
  {
    title: "Alert in one step",
    body: "Pick the blood type you need. Eligible, matching donors near you get an alert on their phone.",
  },
  {
    title: "Track the response",
    body: "See who said Yes, who is on the way and who has donated, with a timer from the moment you sent the alert.",
  },
];

// Made-up example counts: verified vs self-reported are counted separately.
const COUNTS: Record<string, [number, number]> = {
  "O−": [6, 4],
  "O+": [14, 9],
  "A−": [3, 2],
  "A+": [11, 7],
  "B−": [2, 3],
  "B+": [9, 6],
  "AB−": [1, 1],
  "AB+": [3, 2],
};
const TYPES = Object.keys(COUNTS);

const RESPONSES = [
  { name: "Donor 1", at: 4, state: "Said Yes" },
  { name: "Donor 2", at: 9, state: "Said Yes" },
  { name: "Donor 1", at: 14, state: "On the way" },
  { name: "Donor 3", at: 19, state: "Said Yes" },
] as const;

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export function Hospitals() {
  const [type, setType] = useState("O−");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (tick.current) clearInterval(tick.current); }, []);

  function start() {
    if (tick.current) clearInterval(tick.current);
    setElapsed(0);
    setRunning(true);
    tick.current = setInterval(() => {
      setElapsed((e) => {
        if (e >= 22) {
          if (tick.current) clearInterval(tick.current);
          return e;
        }
        return e + 1;
      });
    }, 1000);
  }

  function reset() {
    if (tick.current) clearInterval(tick.current);
    setRunning(false);
    setElapsed(0);
  }

  const seen = RESPONSES.filter((r) => r.at <= elapsed);
  const yes = seen.filter((r) => r.state === "Said Yes").length;
  const [verified, self] = COUNTS[type];

  return (
    <section id="hospitals" className="bg-surface px-6 py-24 lg:px-12">
      <div className="mx-auto max-w-[1100px]">
        <Reveal className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[2.5px] text-red">For hospitals and blood banks</p>
          <h2 className="mt-4 text-[32px] font-extrabold tracking-[-1px] text-ink lg:text-[40px]">
            Find matching donors in minutes, not hours.
          </h2>
          <p className="mx-auto mt-4 max-w-[560px] text-base leading-[1.7] text-ink-mid">
            We are starting with a small pilot at one hospital. If you run a blood bank and want to take part in a
            drill, we would like to hear from you.
          </p>
        </Reveal>

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            {POINTS.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.1}>
                <div className="rounded-card border-[0.5px] border-[#E5E5EA] bg-white p-6">
                  <h3 className="text-lg font-bold text-ink">{p.title}</h3>
                  <p className="mt-2 text-sm leading-[1.7] text-ink-mid">{p.body}</p>
                </div>
              </Reveal>
            ))}
            <Button asChild size="lg" className="mt-2">
              <Link href="/hospital/apply">Apply for the pilot</Link>
            </Button>
          </div>

          <Reveal delay={0.15}>
            <div className="rounded-card border-[0.5px] border-[#E5E5EA] bg-white p-5 shadow-raised sm:p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-extrabold text-ink">Example Hospital dashboard</p>
                <span className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-ink-muted">
                  Example data
                </span>
              </div>

              <p className="mt-5 text-xs font-bold text-ink-muted">Eligible donors within 10 km, tap a type</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      reset();
                      setType(t);
                    }}
                    className={cn(
                      "rounded-xl border px-2 py-2.5 text-center transition-colors",
                      t === type ? "border-red bg-red text-white" : "border-hairline hover:border-red-mid",
                    )}
                  >
                    <span className="block text-sm font-extrabold">{t}</span>
                    <span className={cn("block text-[11px]", t === type ? "text-white/80" : "text-ink-muted")}>
                      {COUNTS[t][0] + COUNTS[t][1]} donors
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-ink-muted">
                {type}: <span className="font-semibold text-ink">{verified} verified</span> ·{" "}
                {self} self-reported, counted separately
              </p>

              <div className="mt-5 flex items-center justify-between rounded-2xl bg-surface p-4">
                <div>
                  <p className="text-xs text-ink-muted">Response timer</p>
                  <p className="text-2xl font-extrabold tabular-nums text-ink">{fmt(elapsed)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-ink-muted">Yes</p>
                  <p className="text-2xl font-extrabold tabular-nums text-red">{yes}</p>
                </div>
                {running ? (
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-full border border-[#E5E5EA] bg-white px-4 py-2 text-sm font-bold text-ink-mid"
                  >
                    Reset
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={start}
                    className="rounded-full bg-red px-4 py-2 text-sm font-bold text-white transition-transform hover:scale-[1.03] active:scale-95"
                  >
                    Alert Pod: {type}
                  </button>
                )}
              </div>

              <ul className="mt-3 min-h-[120px] space-y-2" aria-live="polite">
                {!running && (
                  <li className="rounded-xl border border-dashed border-hairline p-4 text-center text-xs text-ink-muted">
                    Send an example alert to watch responses arrive.
                  </li>
                )}
                {seen.map((r) => (
                  <m.li
                    key={`${r.name}-${r.at}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-sm shadow-raised"
                  >
                    <span className="flex size-7 items-center justify-center rounded-full bg-red-light">
                      {r.state === "On the way" ? (
                        <Truck className="size-3.5 text-red" />
                      ) : (
                        <Check className="size-3.5 text-red" />
                      )}
                    </span>
                    <span className="flex-1 font-semibold text-ink">{r.name}</span>
                    <span className="text-xs text-ink-muted">{r.state}</span>
                  </m.li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-ink-muted">
                Names appear only after a donor says Yes. Timings here are illustrative.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
