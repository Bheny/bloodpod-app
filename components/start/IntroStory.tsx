"use client";

import { useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { BellRing, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const SLIDES = 4;
const REPLIES = ["Ama", "Kofi", "Auntie Pat", "Uncle Ben"];

const EMPTY = "rgba(221,0,0,0)";
const RED = "#DD0000";

/**
 * A place in the circle. `fillAt` makes it start empty and fill with red after that many
 * seconds, so a row of them reads as a circle being built one person at a time.
 */
function Dot({ filled = false, fillAt, label }: { filled?: boolean; fillAt?: number; label?: string }) {
  const building = fillAt !== undefined;
  return (
    <m.span
      initial={{ scale: 0.85, backgroundColor: building ? EMPTY : filled ? RED : EMPTY }}
      animate={
        building
          ? { scale: [0.85, 1.18, 1], backgroundColor: RED, borderColor: RED }
          : { scale: 1, backgroundColor: filled ? RED : EMPTY }
      }
      transition={building ? { delay: fillAt, duration: 0.45, ease: "easeOut" } : { duration: 0.3 }}
      className={cn(
        "flex size-10 items-center justify-center rounded-full border-[1.5px] text-label font-bold",
        filled ? "border-transparent text-white" : "border-dashed border-ink-faint text-white",
      )}
    >
      {label}
    </m.span>
  );
}

/** Three short screens, one idea each, before the first question. */
export function IntroStory({ onDone, signedIn = false }: { onDone: () => void; signedIn?: boolean }) {
  const [slide, setSlide] = useState(0);
  const last = slide === SLIDES - 1;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={SLIDES} aria-valuenow={slide + 1}>
        {Array.from({ length: SLIDES }, (_, i) => (
          <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-hairline">
            <span
              className="block h-full rounded-full bg-red transition-all duration-300"
              style={{ width: i <= slide ? "100%" : "0%" }}
            />
          </span>
        ))}
        <button type="button" onClick={onDone} className="ml-2 text-xs font-semibold text-ink-muted hover:text-ink">
          Skip
        </button>
      </div>

      <AnimatePresence mode="wait">
        <m.div
          key={slide}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto py-6"
        >
          <div className="my-auto">
          {slide === 0 && (
            <>
              <div className="mb-8 flex items-center gap-3" aria-hidden>
                <Dot filled label="You" />
                <span className="h-px w-8 border-t-[1.5px] border-dashed border-ink-faint/60" />
                <Dot />
                <Dot />
              </div>
              <h1 className="text-[32px] font-extrabold leading-[1.08] tracking-[-1.1px] text-ink">
                Nobody plans for blood until the night it&apos;s needed.
              </h1>
              <p className="mt-4 text-base leading-relaxed text-ink-mid">
                Then it&apos;s a scramble of calls, and the question: who can give, right now?
              </p>
            </>
          )}

          {slide === 1 && (
            <>
              <div className="mb-8 flex flex-wrap gap-2.5" aria-hidden>
                <Dot filled label="You" />
                {Array.from({ length: 9 }, (_, i) => (
                  <Dot key={i} fillAt={0.4 + i * 0.28} />
                ))}
              </div>
              <h1 className="text-[32px] font-extrabold leading-[1.08] tracking-[-1.1px] text-ink">
                So build your circle first.
              </h1>
              <p className="mt-4 text-base leading-relaxed text-ink-mid">
                Like savings, you put it in place before you need it. 10 to 20 people you trust: family, church, office
                or friends.
              </p>
            </>
          )}

          {slide === 2 && (
            <>
              <div className="mb-8 flex items-center justify-between gap-1" aria-hidden>
                {[
                  { label: "Other circles", tone: "bg-panel/70", delay: 0.9, count: 6 },
                  { label: "Your circle", tone: "bg-red", delay: 0, count: 8 },
                  { label: "Donors nearby", tone: "bg-panel/70", delay: 1.4, count: 5 },
                ].map((g, gi) => (
                  <div key={g.label} className="flex flex-1 items-center">
                    {gi > 0 && (
                      <m.span
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: gi === 1 ? 0.55 : 1.05, duration: 0.35 }}
                        className="h-px w-4 border-t-[1.5px] border-dashed border-ink-faint"
                        // Each link grows out from your circle toward the one it reaches.
                        style={{ transformOrigin: gi === 1 ? "right" : "left" }}
                      />
                    )}
                    <m.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: g.delay, duration: 0.4 }}
                      className="flex flex-1 flex-col items-center gap-2"
                    >
                      <div className="flex max-w-[84px] flex-wrap justify-center gap-1">
                        {Array.from({ length: g.count }, (_, i) => (
                          <span key={i} className={cn("size-3.5 rounded-full", g.tone)} />
                        ))}
                      </div>
                      <span className="text-center text-label font-bold text-ink-muted">{g.label}</span>
                    </m.div>
                  </div>
                ))}
              </div>
              <h1 className="text-[32px] font-extrabold leading-[1.08] tracking-[-1.1px] text-ink">
                Then your circle joins a bigger one.
              </h1>
              <p className="mt-4 text-base leading-relaxed text-ink-mid">
                Once yours is built, you can reach beyond it: other circles and donors near you, found by blood type and
                area. The more circles join, the more people there are to call on.
              </p>
            </>
          )}

          {slide === 3 && (
            <>
              <div className="mb-8 flex flex-col gap-2" aria-hidden>
                <m.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2.5 rounded-card bg-red-light px-4 py-3"
                >
                  <BellRing className="size-5 text-red-fg" />
                  <span className="text-sm font-bold text-red-fg">Blood needed near you</span>
                </m.div>
                {REPLIES.map((name, i) => (
                  <m.div
                    key={name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.35 }}
                    className="flex items-center justify-between rounded-card bg-success-soft px-4 py-2.5"
                  >
                    <span className="text-sm font-semibold text-ink">{name}</span>
                    <span className="flex items-center gap-1 text-sm font-bold text-success-strong">
                      <Check className="size-4" /> Yes
                    </span>
                  </m.div>
                ))}
              </div>
              <h1 className="text-[32px] font-extrabold leading-[1.08] tracking-[-1.1px] text-ink">
                When it matters, one alert reaches them all.
              </h1>
              <p className="mt-4 text-base leading-relaxed text-ink-mid">
                They answer Yes or No in seconds. No calls, no group-chat chaos.
              </p>
            </>
          )}
          </div>
        </m.div>
      </AnimatePresence>

      <div className="flex shrink-0 gap-2">
        {slide > 0 && (
          <button
            type="button"
            onClick={() => setSlide((s) => s - 1)}
            className="rounded-full bg-surface px-5 text-body-sm font-semibold text-ink-mid hover:bg-hairline"
          >
            Back
          </button>
        )}
        <Button onClick={() => (last ? onDone() : setSlide((s) => s + 1))} size="lg" className="flex-1">
          {last ? "Build my circle" : "Next"}
        </Button>
      </div>
      <p className="mt-3 text-center text-xs text-ink-muted">
        {last ? "Takes 2 minutes. Free for donors. No account needed yet." : " "}
      </p>
    </div>
  );
}
