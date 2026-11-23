"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Stop {
  /** The nav tab to point at. No target means a card in the middle of the screen. */
  target: string | null;
  title: string;
  body: string;
}

const STOPS: Stop[] = [
  {
    target: null,
    title: "Welcome to BloodPod",
    body: "A 30 second look at where everything lives. You can skip it now and take it again any time.",
  },
  {
    target: "nav-/dashboard",
    title: "Home",
    body: "Emergencies near you, your next donation date and your Blood Card. Your checklist is here too.",
  },
  {
    target: "nav-/pod",
    title: "My Pod",
    body: "The people you trust. Invite them here, and see who is ready to donate if blood is needed.",
  },
  {
    target: "nav-/discover",
    title: "Discover",
    body: "Find donors near you and ask for their help. People who choose to be listed show their first name.",
  },
  {
    target: "nav-/services",
    title: "Services",
    body: "Find a lab near you for the tests that matter, and book one.",
  },
  {
    target: "nav-/profile",
    title: "Profile",
    body: "Your details, alerts and privacy. Your Get started list and this tour are here whenever you want them.",
  },
  {
    target: null,
    title: "You are ready to begin",
    body: "Your Get started list takes you through the first steps, one at a time. Do them in any order.",
  },
];

const WIDTH = 320;
const EDGE = 12;
const PAD = 6;
const noop = () => () => {};

/** The first visible element with this marker. The phone tabs and the desktop sidebar both carry them, and only one is shown. */
function findVisible(target: string): DOMRect | null {
  for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return r;
  }
  return null;
}

async function markSeen() {
  try {
    await fetch("/api/get-started", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "tour-done" }),
      keepalive: true,
    });
  } catch {
    // Not worth blocking the person over.
  }
}

/**
 * A short first-run tour of the five tabs: a dimmed screen, a cut-out round the tab being explained, and a card.
 * It shows once, on Home, for someone new, and again whenever the URL has ?tour=1 (the Get started page links there).
 */
export function SpotlightTour({ pending }: { pending: boolean }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const replay = params.get("tour") === "1";
  const mounted = useSyncExternalStore(noop, () => true, () => false);

  const [finished, setFinished] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const next = useRef<HTMLButtonElement>(null);

  const active = mounted && (replay || (pending && !finished && pathname === "/dashboard"));
  const stop = STOPS[index];
  const last = index === STOPS.length - 1;

  const finish = useCallback(
    (to?: string) => {
      if (pending && !finished) {
        setFinished(true);
        void markSeen();
      }
      setIndex(0);
      setRect(null);
      if (to) router.push(to);
      else if (replay) router.replace(pathname);
    },
    [pending, finished, replay, pathname, router],
  );

  // Find the tab being explained, and keep following it if the window changes.
  useLayoutEffect(() => {
    if (!active) return;
    const measure = () => setRect(stop.target ? findVisible(stop.target) : null);
    const frame = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [active, stop.target]);

  useEffect(() => {
    if (!active) return;
    next.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight" && !last) setIndex((i) => i + 1);
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, index, last, finish]);

  if (!active) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(WIDTH, vw - EDGE * 2);
  // A target that is not on screen (hidden at this width) is explained in the middle, like the first card.
  const anchored = Boolean(stop.target && rect);

  let bubble: React.CSSProperties;
  if (!anchored || !rect) {
    bubble = { left: (vw - width) / 2, top: vh / 2, width, transform: "translateY(-50%)" };
  } else if (rect.top > vh * 0.5) {
    // The phone's bottom tabs: the card sits above them.
    bubble = { left: Math.max(EDGE, Math.min(rect.left + rect.width / 2 - width / 2, vw - width - EDGE)), bottom: vh - rect.top + PAD + 12, width };
  } else if (rect.right < 320 && vw >= 1024) {
    // The desktop sidebar: the card sits beside it.
    bubble = { left: rect.right + PAD + 16, top: Math.max(EDGE, Math.min(rect.top - 8, vh - 240)), width };
  } else {
    bubble = { left: Math.max(EDGE, Math.min(rect.left, vw - width - EDGE)), top: rect.bottom + PAD + 12, width };
  }

  return createPortal(
    <div className="fixed inset-0 z-[80]">
      {/* Blocks taps on the page underneath while the tour is open. */}
      <div className="absolute inset-0" aria-hidden="true" />

      {anchored && rect ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-2xl ring-2 ring-white/90 motion-safe:transition-all motion-safe:duration-300"
          style={{
            left: rect.left - PAD,
            top: rect.top - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: "0 0 0 100vmax rgba(10, 10, 12, 0.62)",
          }}
        />
      ) : (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[rgba(10,10,12,0.62)]" />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        className="absolute rounded-3xl border-[0.5px] border-hairline bg-card p-4 shadow-floating"
        style={bubble}
      >
        <p className="text-label font-bold uppercase tracking-[1.5px] text-red-fg">
          {index + 1} of {STOPS.length}
        </p>
        <h2 id="tour-title" className="mt-1 text-title font-extrabold tracking-[-0.4px] text-ink">
          {stop.title}
        </h2>
        <p id="tour-body" className="mt-1.5 text-body-sm leading-relaxed text-ink-mid">
          {stop.body}
        </p>

        <div className="mt-4 flex items-center gap-2">
          {last ? (
            <>
              <Button ref={next} size="sm" className="flex-1" onClick={() => finish("/get-started")}>
                See my first steps
              </Button>
              <Button size="sm" variant="secondary" onClick={() => finish()}>
                Close
              </Button>
            </>
          ) : (
            <>
              <Button ref={next} size="sm" className="flex-1" onClick={() => setIndex((i) => i + 1)}>
                {index === 0 ? "Show me" : "Next"}
              </Button>
              {index > 0 && (
                <Button size="sm" variant="secondary" onClick={() => setIndex((i) => Math.max(0, i - 1))}>
                  Back
                </Button>
              )}
            </>
          )}
        </div>

        {!last && (
          <button
            type="button"
            onClick={() => finish()}
            className={cn("mt-3 w-full text-center text-caption font-semibold text-ink-muted underline-offset-2 hover:underline")}
          >
            Skip the tour
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
