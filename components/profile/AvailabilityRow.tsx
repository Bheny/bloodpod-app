"use client";

import { useState } from "react";
import { HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";

export function AvailabilityRow({ initiallyAvailable }: { initiallyAvailable: boolean }) {
  const [isAvailable, setIsAvailable] = useState(initiallyAvailable);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !isAvailable;
    setSaving(true);
    setIsAvailable(next);
    try {
      const res = await fetch("/api/profile/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: next }),
      });
      if (!res.ok) throw new Error("Failed to save");
    } catch {
      setIsAvailable(!next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2.5 rounded-2xl border-[0.5px] border-[#E5E5EA] bg-white px-3.5 py-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-surface">
        <HeartHandshake className="size-4 text-ink-mid" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-bold text-ink">Available to help</p>
        <p className="text-[10px] text-ink-muted">Let your pod know you&apos;re ready to donate</p>
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={saving}
        role="switch"
        aria-checked={isAvailable}
        className={cn(
          "relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200",
          isAvailable ? "bg-red" : "bg-[#E5E5EA]",
          saving && "opacity-60",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200",
            isAvailable ? "translate-x-[18px]" : "translate-x-0",
            saving && "animate-pulse",
          )}
        />
      </button>
    </div>
  );
}
