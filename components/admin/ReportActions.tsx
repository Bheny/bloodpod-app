"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Action = "dismiss" | "action" | "hold" | "release";

/** An admin's decision about a reported person. The note is for admins only. */
export function ReportActions({ userId, held }: { userId: string; held: boolean }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: Action) {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, note: note.trim() || undefined }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setError("That did not save. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  const btn = "min-h-10 rounded-full px-4 text-caption font-bold disabled:opacity-50";
  return (
    <div className="flex flex-col gap-2">
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        placeholder="Note for the team (optional)"
        className="min-h-10 rounded-2xl border-[0.5px] border-hairline bg-card px-3 text-body-sm text-ink"
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy !== null} onClick={() => run("dismiss")} className={`${btn} border border-hairline bg-card text-ink`}>
          {busy === "dismiss" ? "Saving..." : "No problem found"}
        </button>
        {held ? (
          <button type="button" disabled={busy !== null} onClick={() => run("release")} className={`${btn} bg-surface text-ink`}>
            {busy === "release" ? "Saving..." : "Release the pause"}
          </button>
        ) : (
          <button type="button" disabled={busy !== null} onClick={() => run("hold")} className={`${btn} bg-surface text-ink`}>
            {busy === "hold" ? "Saving..." : "Pause their reach"}
          </button>
        )}
        <button type="button" disabled={busy !== null} onClick={() => run("action")} className={`${btn} bg-red text-white`}>
          {busy === "action" ? "Saving..." : "Handled, keep paused"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-caption text-red-fg">
          {error}
        </p>
      )}
    </div>
  );
}
