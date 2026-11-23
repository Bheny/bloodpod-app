"use client";

import { useState } from "react";

/** "Keep me off": leaves this person off BloodPod's Garden leaders posters. Off by default, so first names can be shown. */
export function VisibilityToggle({ initialHidden }: { initialHidden: boolean }) {
  const [hidden, setHidden] = useState(initialHidden);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function flip() {
    const next = !hidden;
    setBusy(true);
    setError(false);
    const res = await fetch("/api/garden/visibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: next }),
    }).catch(() => null);
    if (res?.ok) setHidden(next);
    else setError(true);
    setBusy(false);
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-body-sm font-bold text-ink">Keep me off the Garden leaders</p>
          <p className="mt-0.5 text-caption text-ink-muted">
            BloodPod may celebrate the donors growing their Pods, showing your first name only, with your title and Garden stage. Turn this on and your name is never shown. You can change it any time.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={hidden}
          aria-label="Keep me off the Garden leaders"
          disabled={busy}
          onClick={flip}
          className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 motion-reduce:transition-none ${hidden ? "bg-success-strong" : "bg-hairline"}`}
        >
          <span className={`absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${hidden ? "translate-x-5" : ""}`} />
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-caption text-red-fg">
          That did not save. Try again.
        </p>
      )}
    </div>
  );
}
