"use client";

import { ReportButton } from "@/components/reports/ReportButton";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { Check, Clock, MessageCircle, Phone, Radio, Users } from "lucide-react";
import { jsonFetcher } from "@/lib/fetcher";
import type { RequesterView } from "@/lib/alerts";
import { cn } from "@/lib/utils";

const POLL_MS = 8_000;
const URGENCY = { CRITICAL: "Critical", URGENT: "Urgent", STANDARD: "Needed" } as const;

/** Wa.me wants digits only, with the country code. Ghana numbers written 0XX become 233XX. */
function waNumber(phone: string) {
  const d = phone.replace(/\D/g, "");
  return d.startsWith("0") ? `233${d.slice(1)}` : d;
}

function ago(iso: string | null, now: number) {
  if (!iso) return "";
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
}

function left(iso: string | null, now: number) {
  if (!iso) return null;
  const s = Math.round((new Date(iso).getTime() - now) / 1000);
  if (s <= 0) return null;
  const m = Math.ceil(s / 60);
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`;
}

/** The person who asked follows their request: who was told, who is coming (with a way to call), and a way to close it. */
export function RequestTracker({ initial }: { initial: RequesterView }) {
  const { data, mutate } = useSWR<{ request: RequesterView }>(`/api/alerts/${initial.id}`, jsonFetcher, {
    fallbackData: { request: initial },
    refreshInterval: POLL_MS,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });
  const r = data?.request ?? initial;
  const open = r.status === "OPEN";

  // One ticking clock for "2 min ago" and the countdown, without re-fetching.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  const [busy, setBusy] = useState<"FULFILLED" | "CANCELLED" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function close(outcome: "FULFILLED" | "CANCELLED") {
    setBusy(outcome);
    setError(null);
    try {
      const res = await fetch(`/api/alerts/${r.id}/close`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ outcome }) });
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Something went wrong");
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setBusy(null);
  }

  const widensIn = left(r.widensAt, now);
  const heading =
    r.status === "FULFILLED" ? "The blood is covered" : r.status === "CANCELLED" ? "You closed this request" : r.status === "EXPIRED" ? "This request ran out of time" : r.coming.length > 0 ? `${r.coming.length} can come` : "Waiting for answers";

  return (
    <div className="flex flex-col gap-3">
      <section className={cn("rounded-3xl p-5 text-white shadow-raised", open ? "bg-panel" : "bg-ink-mid")}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full px-2.5 py-0.5 text-label font-bold uppercase tracking-wide", r.urgency === "CRITICAL" && open ? "bg-red" : "bg-white/15")}>{URGENCY[r.urgency]}</span>
          {r.isTest && <span className="rounded-full bg-white px-2.5 py-0.5 text-label font-bold uppercase tracking-wide text-ink">Test</span>}
          <span className="text-label text-white/70">{ago(r.createdAt, now)}</span>
        </div>
        <p className="mt-2 text-title-lg font-extrabold leading-tight tracking-[-0.6px]">
          {r.bloodType} needed at {r.facility}
        </p>
        {r.location && <p className="mt-1 text-body-sm text-white/75">{r.location}</p>}
        <p className="mt-3 text-body font-bold" aria-live="polite">
          {heading}
        </p>
      </section>

      {open && (
        <section className="rounded-3xl border-[0.5px] border-hairline bg-card p-4 shadow-raised" aria-label="Who has been told">
          <ul className="flex flex-col gap-3 text-body-sm">
            <li className="flex items-start gap-3">
              <Users className="mt-0.5 size-5 shrink-0 text-ink-muted" aria-hidden="true" />
              <span className="text-ink">
                <strong>{r.podAlerted}</strong> in your Pod {r.podAlerted === 1 ? "was" : "were"} alerted
                {r.waiting > 0 && <span className="text-ink-muted"> · {r.waiting} yet to answer</span>}
                {r.cant > 0 && <span className="text-ink-muted"> · {r.cant} cannot come</span>}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Radio className="mt-0.5 size-5 shrink-0 text-ink-muted" aria-hidden="true" />
              <span className="text-ink">
                {r.widenedAt ? (
                  <>
                    Widened to <strong>{r.nearbyAlerted}</strong> {r.nearbyAlerted === 1 ? "donor" : "donors"} nearby
                  </>
                ) : r.isTest ? (
                  <span className="text-ink-muted">A test never widens to donors nearby</span>
                ) : widensIn ? (
                  <>
                    <span className="text-ink-muted">If nobody says yes, we widen to donors nearby in</span> <strong>{widensIn}</strong>
                  </>
                ) : (
                  <span className="text-ink-muted">Widening to donors nearby…</span>
                )}
              </span>
            </li>
          </ul>
        </section>
      )}

      <section aria-label="Who can come" className="flex flex-col gap-2.5">
        <h2 className="px-1 text-label font-bold uppercase tracking-[1.2px] text-ink-muted">Can come ({r.coming.length})</h2>
        {r.coming.length === 0 ? (
          <div className="flex items-center gap-3 rounded-3xl border-[0.5px] border-hairline bg-card p-4 text-body-sm text-ink-muted shadow-raised">
            <Clock className="size-5 shrink-0" aria-hidden="true" />
            {open ? "Nobody yet. This page updates by itself." : "Nobody said yes."}
          </div>
        ) : (
          r.coming.map((c) => (
            <div key={c.userId} className="flex items-center gap-3 rounded-3xl border-[0.5px] border-hairline bg-card p-4 shadow-raised">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success-soft">
                <Check className="size-5 text-[#1FA855]" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-sm font-bold text-ink">{c.fullName ?? c.firstName ?? "A donor"}</p>
                <p className="text-caption text-ink-muted">
                  {c.scope === "POD" ? "In your Pod" : "Donor nearby"} · {ago(c.answeredAt, now)}
                </p>
              </div>
              {c.phone && (
                <div className="flex shrink-0 gap-2">
                  <a href={`tel:${c.phone}`} aria-label={`Call ${c.firstName ?? "donor"}`} className="flex size-11 items-center justify-center rounded-full bg-red text-white">
                    <Phone className="size-5" aria-hidden="true" />
                  </a>
                  <a
                    href={`https://wa.me/${waNumber(c.phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`WhatsApp ${c.firstName ?? "donor"}`}
                    className="flex size-11 items-center justify-center rounded-full bg-surface text-ink"
                  >
                    <MessageCircle className="size-5" aria-hidden="true" />
                  </a>
                  <ReportButton icon userId={c.userId} name={c.firstName ?? "this person"} />
                </div>
              )}
            </div>
          ))
        )}
      </section>

      {open && (
        <section className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => close("FULFILLED")}
            className="min-h-12 rounded-full bg-red px-5 text-body-sm font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {busy === "FULFILLED" ? "Saving..." : "The blood is covered"}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => close("CANCELLED")}
            className="min-h-12 rounded-full border border-hairline bg-card px-5 text-body-sm font-bold text-ink transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {busy === "CANCELLED" ? "Saving..." : "I no longer need it"}
          </button>
          <p className="text-center text-caption text-ink-muted">Everyone who was alerted is told, so nobody travels for nothing.</p>
          {error && (
            <p role="alert" className="text-center text-caption text-red-fg">
              {error}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
