"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/** Friendly reminders on or off. Alerts about real blood requests are a separate switch and never change. */
export function NudgeSwitch({ initiallyOff }: { initiallyOff: boolean }) {
  const [off, setOff] = useState(initiallyOff);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !off;
    setSaving(true);
    setOff(next);
    try {
      const res = await fetch("/api/nudges/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ off: next }),
      });
      if (!res.ok) throw new Error("Failed to save");
    } catch {
      setOff(!next);
    } finally {
      setSaving(false);
    }
  }

  const on = !off;
  return (
    <div className="flex items-center gap-2.5 rounded-3xl border-[0.5px] border-hairline bg-card px-3.5 py-3 shadow-raised lg:rounded-2xl lg:px-5 lg:py-4">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-surface lg:size-10">
        <Sparkles className="size-4 text-ink-mid lg:size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-caption font-bold text-ink lg:text-body-sm">Friendly reminders</p>
        <p className="text-label text-ink-muted">A gentle word now and then about growing your Pod. Never about emergencies.</p>
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={saving}
        role="switch"
        aria-checked={on}
        aria-label="Friendly reminders"
        className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200", on ? "bg-red" : "bg-hairline", saving && "opacity-60")}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200",
            on ? "translate-x-[18px]" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}
