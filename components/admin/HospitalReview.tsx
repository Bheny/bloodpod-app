"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw, X } from "lucide-react";

type Status = "PENDING" | "APPROVED" | "REJECTED";

export function HospitalReview({ id, status }: { id: string; status: Status }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(next: Status, withNote?: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/hospitals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, note: withNote }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong");
      }
      setRejecting(false);
      setNote("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (status !== "PENDING") {
    return (
      <div>
        <button
          type="button"
          disabled={busy}
          onClick={() => submit("PENDING")}
          className="flex items-center gap-1.5 rounded-full bg-surface px-4 py-2 text-caption font-bold text-ink-mid transition-colors hover:bg-hairline disabled:opacity-50"
        >
          <RotateCcw className="size-3.5" /> Move back to pending
        </button>
        {error && <p className="mt-2 text-caption text-red-fg">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      {!rejecting ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => submit("APPROVED")}
            className="flex items-center gap-1.5 rounded-full bg-[#1FA855] px-5 py-2.5 text-body-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-50"
          >
            <Check className="size-4" /> {busy ? "Saving..." : "Approve"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setRejecting(true)}
            className="flex items-center gap-1.5 rounded-full bg-surface px-5 py-2.5 text-body-sm font-bold text-ink-mid transition-colors hover:bg-hairline disabled:opacity-50"
          >
            <X className="size-4" /> Reject
          </button>
        </div>
      ) : (
        <div className="rounded-xl bg-surface p-3">
          <label htmlFor={`note-${id}`} className="text-caption font-semibold text-ink-mid">
            Why? (only you can see this)
          </label>
          <textarea
            id={`note-${id}`}
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="For example: could not reach the number given"
            className="mt-1.5 w-full resize-none rounded-lg border border-hairline bg-card px-3 py-2 text-body-sm text-ink focus:border-red focus:outline-none"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={busy || !note.trim()}
              onClick={() => submit("REJECTED", note.trim())}
              className="rounded-full bg-panel px-4 py-2 text-caption font-bold text-white disabled:opacity-40"
            >
              {busy ? "Saving..." : "Confirm reject"}
            </button>
            <button type="button" onClick={() => setRejecting(false)} className="px-3 py-2 text-caption font-semibold text-ink-mid">
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-caption text-red-fg">{error}</p>}
    </div>
  );
}
