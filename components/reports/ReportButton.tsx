"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { REASONS, REPORT, type ReasonId } from "@/lib/report-rules";
import { cn } from "@/lib/utils";

/**
 * "Report this person". Only for someone you have met through BloodPod. They are never told it was you.
 * `icon` makes it a small flag button for tight rows; otherwise it is a quiet text link.
 */
export function ReportButton({ userId, name, icon = false, className }: { userId: string; name: string; icon?: boolean; className?: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReasonId | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    // Start clean next time, unless it was sent.
    if (!done) setError(null);
  }

  async function send() {
    if (!reason) return setError("Choose what went wrong.");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, reason, note }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {icon ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Report ${name}`}
          className={cn("flex size-11 items-center justify-center rounded-full bg-surface text-ink-muted", className)}
        >
          <Flag className="size-5" aria-hidden="true" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn("inline-flex min-h-10 items-center gap-1.5 text-caption font-bold text-ink-muted", className)}
        >
          <Flag className="size-3.5" aria-hidden="true" /> Report {name}
        </button>
      )}

      <Modal open={open} onClose={close}>
        {done ? (
          <div className="text-center">
            <p className="text-base font-extrabold text-ink">Thank you for telling us</p>
            <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
              Someone at BloodPod will look into it. {name} is not told it was you.
            </p>
            <button type="button" onClick={close} className="mt-4 min-h-11 rounded-full bg-red px-6 text-body-sm font-bold text-white">
              Done
            </button>
          </div>
        ) : (
          <div>
            <p className="text-base font-extrabold text-ink">Report {name}</p>
            <p className="mt-1 text-caption leading-relaxed text-ink-muted">
              This helps keep BloodPod safe for everyone. {name} is never told who reported them.
            </p>

            <fieldset className="mt-4 flex flex-col gap-2">
              <legend className="sr-only">What went wrong</legend>
              {REASONS.map((r) => (
                <label
                  key={r.id}
                  className={cn(
                    "flex min-h-11 cursor-pointer items-start gap-2.5 rounded-2xl border-[0.5px] px-3 py-2.5",
                    reason === r.id ? "border-red bg-red-light" : "border-hairline bg-card",
                  )}
                >
                  <input type="radio" name="reason" value={r.id} checked={reason === r.id} onChange={() => setReason(r.id)} className="mt-1 accent-[#DD0000]" />
                  <span>
                    <span className="block text-body-sm font-bold text-ink">{r.label}</span>
                    {r.hint && <span className="block text-caption text-ink-muted">{r.hint}</span>}
                  </span>
                </label>
              ))}
            </fieldset>

            <label className="mt-3 block">
              <span className="text-caption font-bold text-ink-mid">Anything else we should know? (optional)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={REPORT.noteMax}
                rows={3}
                className="mt-1 w-full rounded-2xl border-[0.5px] border-hairline bg-card p-3 text-body-sm text-ink"
              />
            </label>

            {error && (
              <p role="alert" className="mt-2 text-caption text-red-fg">
                {error}
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <button type="button" onClick={close} className="min-h-11 flex-1 rounded-full border border-hairline bg-card text-body-sm font-bold text-ink">
                Cancel
              </button>
              <button type="button" onClick={send} disabled={busy} className="min-h-11 flex-1 rounded-full bg-red text-body-sm font-bold text-white disabled:opacity-50">
                {busy ? "Sending..." : "Send report"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
