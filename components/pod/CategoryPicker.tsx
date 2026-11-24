"use client";

import { useState } from "react";
import { POD_CATEGORIES, POD_CATEGORY_LABELS, type PodCategoryId } from "@/lib/pod-categories";
import { cn } from "@/lib/utils";

/** The owner sets how they know someone. Saves as soon as a category is tapped. */
export function CategoryPicker({
  podId,
  userId,
  value,
  onChanged,
}: {
  podId: string;
  userId: string;
  value: PodCategoryId;
  onChanged: (category: PodCategoryId) => void;
}) {
  const [saving, setSaving] = useState<PodCategoryId | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(category: PodCategoryId) {
    if (category === value || saving) return;
    setError(null);
    setSaving(category);
    try {
      const res = await fetch(`/api/pods/${podId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save that");
      onChanged(category);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save that");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div>
      <p className="text-label font-bold uppercase tracking-wide text-ink-muted">How you know them</p>
      <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="How you know them">
        {POD_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={c === value}
            disabled={saving !== null}
            onClick={() => choose(c)}
            className={cn(
              "min-h-9 rounded-full px-3 text-caption font-bold transition-colors disabled:opacity-60",
              c === value ? "bg-panel text-white" : "bg-surface text-ink-mid hover:bg-hairline",
            )}
          >
            {POD_CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-caption text-red-fg">{error}</p>}
      <p className="mt-2 text-label text-ink-muted">Only you and that person can see this.</p>
    </div>
  );
}
