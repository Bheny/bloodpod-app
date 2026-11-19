"use client";

import { useState } from "react";
import Link from "next/link";
import { BellOff, BellRing, Power } from "lucide-react";
import { TileLabel, tileClass } from "@/components/dashboard/home/HomeTiles";
import { cn } from "@/lib/utils";

/** Whether you can be called on right now, with the switch to change it. Same behaviour as the desktop card. */
export function AvailabilityTile({
  isEligible,
  initiallyAvailable,
  hasPush,
}: {
  isEligible: boolean;
  initiallyAvailable: boolean;
  hasPush: boolean;
}) {
  const [available, setAvailable] = useState(initiallyAvailable);
  const [saving, setSaving] = useState(false);
  const resting = !isEligible;
  const on = available && !resting;

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

  return (
    <div className={cn(tileClass, "active:scale-100")}>
      <TileLabel icon={Power}>Availability</TileLabel>

      <p className={cn("mt-3 text-[20px] font-extrabold leading-tight tracking-[-0.5px]", on ? "text-success-strong" : "text-ink-mid")}>
        {resting ? "Resting" : on ? "Available" : "Paused"}
      </p>
      <p className="mt-0.5 text-caption leading-snug text-ink-muted">
        {resting ? "Until you're eligible" : on ? "Ready to be alerted" : "Not being alerted"}
      </p>

      {/* The switch gets its own line: the tile is too narrow to share one with the status text. */}
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Available to help"
        disabled={saving || resting}
        onClick={toggle}
        className={cn("relative mt-3 h-7 w-12 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-40", on ? "bg-red" : "bg-hairline")}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform duration-200",
            on ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>

      {hasPush ? (
        <p className="mt-auto flex items-center gap-1 pt-3 text-caption font-semibold text-success-strong">
          <BellRing className="size-3.5" /> Alerts on
        </p>
      ) : (
        <Link href="/profile" className="mt-auto flex items-center gap-1 pt-3 text-caption font-bold text-red-fg">
          <BellOff className="size-3.5" /> Alerts off, turn on
        </Link>
      )}
    </div>
  );
}
