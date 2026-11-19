"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { SERVICE_TESTS, testLabel, type ServiceTestId } from "@/lib/service-tests";
import type { ServiceResult } from "@/lib/services";

const todayIso = () => new Date().toISOString().slice(0, 10);

export function BookingModal({
  lab,
  defaultTests,
  onClose,
}: {
  lab: ServiceResult | null;
  defaultTests: ServiceTestId[];
  onClose: () => void;
}) {
  return (
    <Modal open={lab !== null} onClose={onClose}>
      {/* Keyed by lab so the form starts fresh each time it opens. */}
      {lab && <BookingForm key={lab.id} lab={lab} defaultTests={defaultTests} onClose={onClose} />}
    </Modal>
  );
}

function BookingForm({ lab, defaultTests, onClose }: { lab: ServiceResult; defaultTests: ServiceTestId[]; onClose: () => void }) {
  const offered = lab.allTests.map((t) => t.id);
  const [tests, setTests] = useState<ServiceTestId[]>(() => {
    const picked = defaultTests.filter((t) => offered.includes(t));
    return picked.length ? picked : offered.slice(0, 1);
  });
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labId: lab.id, testIds: tests, preferredDate: date, note, consent }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't send the request. Try again.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the request. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="py-4 text-center">
        <CheckCircle2 className="mx-auto size-10 text-[#1FA855]" />
        <p className="mt-3 text-title font-extrabold text-ink">Request sent</p>
        <p className="mt-1 text-body-sm text-ink-muted">
          {lab.name} will confirm or suggest another day. You&apos;ll get a notification, and you can follow it under My
          bookings.
        </p>
        <Link href="/services/bookings" className="mt-5 inline-flex rounded-full bg-red px-6 py-3 text-body-sm font-bold text-white">
          View my bookings
        </Link>
        <button type="button" onClick={onClose} className="mt-2 block w-full py-2 text-body-sm font-bold text-ink-muted">
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 pr-6">
      <div>
        <h2 className="text-title font-extrabold text-ink">Request a test</h2>
        <p className="text-caption text-ink-muted">{lab.name}, {lab.town}</p>
      </div>

      <fieldset>
        <legend className="text-caption font-bold text-ink">Which tests?</legend>
        <div className="mt-1.5 flex flex-col gap-1.5">
          {SERVICE_TESTS.filter((t) => offered.includes(t.id)).map((t) => (
            <label key={t.id} className="flex items-center gap-2 text-body-sm text-ink">
              <input
                type="checkbox"
                className="accent-red"
                checked={tests.includes(t.id)}
                onChange={() => setTests((cur) => (cur.includes(t.id) ? cur.filter((x) => x !== t.id) : [...cur, t.id]))}
              />
              {testLabel(t.id)}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="text-caption font-bold text-ink">Preferred day</span>
        <input
          type="date"
          required
          min={todayIso()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 w-full rounded-xl border border-hairline bg-card px-3.5 py-2.5 text-base text-ink focus:border-red focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="text-caption font-bold text-ink">Anything the lab should know? (optional)</span>
        <textarea
          rows={2}
          maxLength={300}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 w-full rounded-xl border border-hairline bg-card px-3.5 py-2.5 text-base text-ink focus:border-red focus:outline-none"
        />
      </label>

      <label className="flex items-start gap-2 text-caption text-ink-mid">
        <input type="checkbox" className="mt-0.5 accent-red" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        I agree to share my name and phone number with {lab.name} so they can reach me about this request.
      </label>

      {error && <p className="text-caption text-red-fg">{error}</p>}

      <button
        type="submit"
        disabled={busy || tests.length === 0 || !date || !consent}
        className="w-full rounded-full bg-red py-3 text-body-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-50"
      >
        {busy ? "Sending..." : "Send request"}
      </button>
    </form>
  );
}
