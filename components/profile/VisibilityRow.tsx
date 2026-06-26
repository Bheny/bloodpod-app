"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export function VisibilityRow({ initiallyPublic }: { initiallyPublic: boolean }) {
  const [isPublic, setIsPublic] = useState(initiallyPublic);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !isPublic;
    setSaving(true);
    setIsPublic(next);
    try {
      const res = await fetch("/api/discover/visibility", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: next }),
      });
      if (!res.ok) throw new Error("Failed to save");
    } catch {
      setIsPublic(!next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2.5 rounded-2xl border-[0.5px] border-[#E5E5EA] bg-white px-3.5 py-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-surface">
        <Eye className="size-4 text-ink-mid" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-bold text-ink">Visible to other donors</p>
        <p className="text-[10px] text-ink-muted">Show up in Discover search results</p>
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={saving}
        role="switch"
        aria-checked={isPublic}
        className={cn(
          "relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200",
          isPublic ? "bg-red" : "bg-[#E5E5EA]",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200",
            isPublic ? "translate-x-[18px]" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}
