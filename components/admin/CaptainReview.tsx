"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

/** Approve or reject one waiting promotion. A rejection needs a reason. */
export function CaptainReview({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(decision: "APPROVED" | "REJECTED", why?: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/captains/promotions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason: why }),
      });
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Something went wrong");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {!rejecting ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => submit("APPROVED")}
            className="flex min-h-11 items-center gap-1.5 rounded-full bg-success-strong px-5 text-body-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-50"
          >
            <Check className="size-4" /> {busy ? "Saving..." : "Approve"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setRejecting(true)}
            className="flex min-h-11 items-center gap-1.5 rounded-full bg-surface px-5 text-body-sm font-bold text-ink-mid transition-colors hover:bg-hairline disabled:opacity-50"
          >
            <X className="size-4" /> Reject
          </button>
        </div>
      ) : (
        <div className="rounded-xl bg-surface p-3">
          <label htmlFor={`why-${id}`} className="text-caption font-semibold text-ink-mid">
            Why? (kept in the audit log)
          </label>
          <textarea
            id={`why-${id}`}
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="For example: the two leaders appear to be the same person"
            className="mt-1.5 w-full resize-none rounded-lg border border-hairline bg-card px-3 py-2 text-body-sm text-ink focus:border-red focus:outline-none"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={busy || !reason.trim()}
              onClick={() => submit("REJECTED", reason.trim())}
              className="min-h-11 rounded-full bg-panel px-4 text-caption font-bold text-white disabled:opacity-40"
            >
              {busy ? "Saving..." : "Confirm reject"}
            </button>
            <button type="button" onClick={() => setRejecting(false)} className="min-h-11 px-3 text-caption font-semibold text-ink-mid">
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-caption text-red-fg">{error}</p>}
    </div>
  );
}
