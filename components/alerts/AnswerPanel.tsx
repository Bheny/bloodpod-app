"use client";

import { ReportButton } from "@/components/reports/ReportButton";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Droplet, Phone } from "lucide-react";
import type { DonorView } from "@/lib/alerts";
import { cn } from "@/lib/utils";

const URGENCY = { CRITICAL: "Critical", URGENT: "Urgent", STANDARD: "Needed" } as const;

/** A donor who was alerted: what is needed, where, and two clear answers. Saying yes shares names and numbers, and says so. */
export function AnswerPanel({ view }: { view: DonorView }) {
  const router = useRouter();
  const [answer, setAnswer] = useState(view.answer);
  const [phone, setPhone] = useState(view.requester.phone);
  const [busy, setBusy] = useState<"COMING" | "CANT" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const open = view.status === "OPEN";
  const who = view.requester.firstName ?? "them";

  async function send(next: "COMING" | "CANT") {
    setBusy(next);
    setError(null);
    try {
      const res = await fetch(`/api/alerts/${view.id}/answer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer: next }) });
      const data = (await res.json().catch(() => ({}))) as { error?: string; requesterPhone?: string | null };
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setAnswer(next);
      setPhone(data.requesterPhone ?? null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setBusy(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <section className={cn("rounded-3xl p-5 text-white shadow-raised", open ? "bg-panel" : "bg-ink-mid")}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full px-2.5 py-0.5 text-label font-bold uppercase tracking-wide", view.urgency === "CRITICAL" && open ? "bg-red" : "bg-white/15")}>{URGENCY[view.urgency]}</span>
          {view.isTest && <span className="rounded-full bg-white px-2.5 py-0.5 text-label font-bold uppercase tracking-wide text-ink">Test</span>}
        </div>
        <div className="mt-3 flex items-start gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-red/25">
            <Droplet className="size-6 text-red-fg" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-title-lg font-extrabold leading-tight tracking-[-0.6px]">
              {view.bloodType} needed at {view.facility}
            </p>
            {view.location && <p className="mt-1 text-body-sm text-white/75">{view.location}</p>}
            <p className="mt-1 text-caption text-white/70">{view.scope === "POD" ? `${who} is in your Pod` : `${who} is asking donors nearby`}</p>
          </div>
        </div>
        {view.message && <p className="mt-3 rounded-2xl bg-white/10 p-3 text-body-sm leading-relaxed">{view.message}</p>}
        {view.othersComing > 0 && open && (
          <p className="mt-3 text-caption font-semibold text-white/85">
            {view.othersComing} {view.othersComing === 1 ? "other is" : "others are"} already on the way
          </p>
        )}
      </section>

      {!open ? (
        <div className="rounded-3xl border-[0.5px] border-hairline bg-card p-5 text-body-sm text-ink shadow-raised">
          {view.status === "FULFILLED" ? "This request is covered. Thank you for being ready." : "This request has closed. You do not need to do anything."}
        </div>
      ) : answer === "COMING" ? (
        <div className="rounded-3xl border-[0.5px] border-hairline bg-card p-5 shadow-raised">
          <p className="flex items-center gap-2 text-body-sm font-bold text-ink">
            <Check className="size-5 text-[#1FA855]" aria-hidden="true" /> You said you can come
          </p>
          <p className="mt-1 text-caption leading-relaxed text-ink-muted">{who} can see your name and number. Please go to {view.facility} as soon as you can, and call if you are delayed.</p>
          {phone && (
            <a href={`tel:${phone}`} className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-full bg-red px-5 text-body-sm font-bold text-white">
              <Phone className="size-5" aria-hidden="true" /> Call {who}
            </a>
          )}
          <button type="button" disabled={busy !== null} onClick={() => send("CANT")} className="mt-3 block text-caption font-bold text-ink-muted underline underline-offset-2">
            {busy === "CANT" ? "Saving..." : "I can no longer come"}
          </button>
        </div>
      ) : answer === "CANT" ? (
        <div className="rounded-3xl border-[0.5px] border-hairline bg-card p-5 shadow-raised">
          <p className="text-body-sm font-bold text-ink">You said you cannot come</p>
          <p className="mt-1 text-caption text-ink-muted">Thank you for answering. Nothing about you was shared.</p>
          <button type="button" disabled={busy !== null} onClick={() => send("COMING")} className="mt-3 text-caption font-bold text-red-fg underline underline-offset-2">
            {busy === "COMING" ? "Saving..." : "Actually, I can come"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => send("COMING")}
            className="min-h-14 rounded-full bg-red px-5 text-body font-extrabold text-white shadow-[0_12px_28px_-8px_rgba(221,0,0,0.55)] transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {busy === "COMING" ? "Saving..." : "Yes, I can come"}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => send("CANT")}
            className="min-h-12 rounded-full border border-hairline bg-card px-5 text-body-sm font-bold text-ink transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {busy === "CANT" ? "Saving..." : "I cannot come"}
          </button>
          <p className="px-2 text-center text-caption leading-relaxed text-ink-muted">
            Saying yes shares your name and number with {who}, and you get theirs. Saying no shares nothing. Nobody is ever paid for giving blood.
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="text-center text-caption text-red-fg">
          {error}
        </p>
      )}

      {!view.isTest && (
        <div className="flex justify-center">
          <ReportButton userId={view.requester.id} name={who === "them" ? "this person" : who} />
        </div>
      )}
    </div>
  );
}
