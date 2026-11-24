"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import type { PodMemberView } from "@/lib/pod-data";
import { POD_CATEGORIES, POD_CATEGORY_LABELS, type PodCategoryId } from "@/lib/pod-categories";
import { cn } from "@/lib/utils";

/**
 * Sort everyone who is still "Other" in one pass: each person has the categories laid out, one tap files them.
 * The list is fixed when it opens, so rows do not jump around while you work. Saves on every tap.
 */
export function SortPeople({
  people,
  podId,
  onChanged,
  onClose,
}: {
  people: PodMemberView[];
  podId: string;
  onChanged: (userId: string, category: PodCategoryId) => void;
  onClose: () => void;
}) {
  // What each person was filed under in this session. Starts empty: nobody is "done" until they are tapped.
  const [chosen, setChosen] = useState<Record<string, PodCategoryId>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sorted = people.filter((p) => chosen[p.id]).length;

  async function file(person: PodMemberView, category: PodCategoryId) {
    if (saving || chosen[person.id] === category) return;
    setError(null);
    setSaving(person.id);
    try {
      const res = await fetch(`/api/pods/${podId}/members/${person.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save that");
      setChosen((c) => ({ ...c, [person.id]: category }));
      onChanged(person.id, category);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save that");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="px-4 pb-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-body-sm font-bold text-ink">Sort your people</p>
          <p className="text-caption text-ink-muted">
            {sorted} of {people.length} sorted. Tap how you know each person. Only you and they can see this.
          </p>
        </div>
        <button type="button" onClick={onClose} className="shrink-0 rounded-full bg-panel px-4 py-2 text-caption font-bold text-white">
          {sorted === people.length ? "Done" : "Close"}
        </button>
      </div>

      {error && <p className="mt-2 text-caption text-red-fg">{error}</p>}

      <ul className="mt-3 space-y-3">
        {people.map((p) => {
          const picked = chosen[p.id];
          return (
            <li key={p.id} className={cn("rounded-2xl p-3", picked ? "bg-success-soft" : "bg-surface")}>
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-body-sm font-semibold text-ink">{p.name}</p>
                {picked && (
                  <span className="flex shrink-0 items-center gap-1 text-label font-bold text-success-strong">
                    <Check className="size-3.5" aria-hidden /> {POD_CATEGORY_LABELS[picked]}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label={`How you know ${p.name}`}>
                {POD_CATEGORIES.filter((c) => c !== "OTHER").map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={picked === c}
                    disabled={saving !== null}
                    onClick={() => file(p, c)}
                    className={cn(
                      "min-h-9 rounded-full px-3 text-caption font-bold transition-colors disabled:opacity-60",
                      picked === c ? "bg-panel text-white" : "bg-card text-ink-mid hover:bg-hairline",
                    )}
                  >
                    {POD_CATEGORY_LABELS[c]}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
