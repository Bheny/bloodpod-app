"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Action = "accept" | "decline" | "cancel";

/** Answer a request (the donor) or take one back (the person who asked). */
export function RequestActions({ id, role, firstName }: { id: string; role: "donor" | "seeker"; firstName: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: Action) {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/discover/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Something went wrong");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(null);
    }
  }

  if (role === "seeker") {
    return (
      <div>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => act("cancel")}
          className="min-h-11 rounded-full bg-surface px-5 text-body-sm font-bold text-ink-mid disabled:opacity-50"
        >
          {busy ? "Saving..." : "Take it back"}
        </button>
        {error && <p role="alert" className="mt-2 text-caption text-red-fg">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => act("accept")}
          className="min-h-11 rounded-full bg-red px-4 text-body-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-50 motion-reduce:transition-none"
        >
          {busy === "accept" ? "Saving..." : "Yes, I can help"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => act("decline")}
          className="min-h-11 rounded-full border border-hairline bg-card px-4 text-body-sm font-bold text-ink transition-transform active:scale-[0.98] disabled:opacity-50 motion-reduce:transition-none"
        >
          {busy === "decline" ? "Saving..." : "Not now"}
        </button>
      </div>
      <p className="mt-2 text-caption text-ink-muted">
        Saying yes shares your name and number with {firstName ?? "them"}, and theirs with you. Saying no shares nothing.
      </p>
      {error && <p role="alert" className="mt-2 text-caption text-red-fg">{error}</p>}
    </div>
  );
}
