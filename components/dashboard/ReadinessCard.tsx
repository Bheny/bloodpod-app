"use client";

import { useState } from "react";
import Link from "next/link";
import { BellOff, BellRing, BadgeCheck, CircleDashed } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type State = "ready" | "paused" | "resting";

export function ReadinessCard({
  isEligible,
  nextEligible,
  initiallyAvailable,
  hasPush,
  verified,
}: {
  isEligible: boolean;
  nextEligible: string | null;
  initiallyAvailable: boolean;
  hasPush: boolean;
  verified: boolean;
}) {
  const [available, setAvailable] = useState(initiallyAvailable);
  const [saving, setSaving] = useState(false);

  const state: State = !isEligible ? "resting" : available ? "ready" : "paused";

  async function toggle() {
    const next = !available;
    setAvailable(next);
    setSaving(true);
    try {
      const res = await fetch("/api/profile/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setAvailable(!next);
    } finally {
      setSaving(false);
    }
  }

  const copy = {
    ready: { title: "You're ready to help", body: "If your blood type is needed near you, we'll alert you.", dot: "bg-[#1FA855]" },
    paused: { title: "Alerts are paused", body: "Switch on to be alerted when your blood type is needed.", dot: "bg-ink-faint" },
    resting: {
      title: nextEligible ? `Resting until ${formatDate(nextEligible)}` : "Resting for now",
      body: "We won't alert you until you're eligible again.",
      dot: "bg-[#F59E0B]",
    },
  }[state];

  return (
    <section className="rounded-2xl border-[0.5px] border-hairline bg-card p-4 shadow-raised lg:p-6">
      <div className="flex items-start gap-3">
        <span className="relative mt-1.5 flex size-2.5 shrink-0">
          {state === "ready" && (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#1FA855] opacity-60" />
          )}
          <span className={cn("relative inline-flex size-2.5 rounded-full", copy.dot)} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body-sm font-bold text-ink lg:text-title">{copy.title}</p>
          <p className="mt-0.5 text-caption text-ink-muted lg:text-body-sm">{copy.body}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={available}
          aria-label="Available to help"
          disabled={saving || state === "resting"}
          onClick={toggle}
          className={cn(
            "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-40",
            available && state !== "resting" ? "bg-red" : "bg-hairline",
          )}
        >
          <span
            className={cn(
              "absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform duration-200",
              available && state !== "resting" ? "translate-x-5" : "translate-x-0",
            )}
          />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t-[0.5px] border-hairline pt-4">
        {hasPush ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5 text-caption font-semibold text-success-strong">
            <BellRing className="size-3.5" /> Alerts on
          </span>
        ) : (
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 rounded-full bg-red-light px-3 py-1.5 text-caption font-semibold text-red-fg"
          >
            <BellOff className="size-3.5" /> Alerts off, turn on
          </Link>
        )}
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-caption font-semibold",
            verified ? "bg-success-soft text-success-strong" : "bg-surface text-ink-mid",
          )}
        >
          {verified ? <BadgeCheck className="size-3.5" /> : <CircleDashed className="size-3.5" />}
          {verified ? "Lab-verified" : "Self-reported"}
        </span>
      </div>
    </section>
  );
}
