"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const field =
  "min-h-11 w-full rounded-xl border border-hairline bg-card px-3 text-body-sm text-ink focus:border-red focus:outline-none";

/** The programme switch. */
export function CaptainSwitch({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function flip() {
    setBusy(true);
    try {
      await fetch("/api/admin/captains/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label="Captain programme"
      disabled={busy}
      onClick={flip}
      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50 ${enabled ? "bg-red" : "bg-hairline"}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 size-7 rounded-full bg-white shadow transition-transform duration-200 motion-reduce:transition-none ${enabled ? "translate-x-6" : "translate-x-0"}`}
      />
    </button>
  );
}

/** A manual change to someone's level. Needs a reason and is written to the audit log. */
export function CaptainOverride() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [level, setLevel] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/captains/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, level: level === "" ? null : Number(level), reason }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setMessage({ ok: true, text: "Saved and logged." });
      setEmail("");
      setReason("");
      router.refresh();
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px]">
      <label className="text-caption font-semibold text-ink-mid">
        Their account email
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`${field} mt-1`} />
      </label>
      <label className="text-caption font-semibold text-ink-mid">
        Level
        <select value={level} onChange={(e) => setLevel(e.target.value)} className={`${field} mt-1`}>
          <option value="">No badge</option>
          <option value="0">0 · Captain</option>
          <option value="1">1 · Senior Captain</option>
          <option value="2">2 · Lead Captain</option>
          <option value="3">3 · Area Lead</option>
          <option value="4">4 · District Lead</option>
          <option value="5">5 · Regional Lead</option>
        </select>
      </label>
      <label className="text-caption font-semibold text-ink-mid md:col-span-2">
        Reason (required)
        <input required minLength={3} value={reason} onChange={(e) => setReason(e.target.value)} className={`${field} mt-1`} />
      </label>
      <div className="flex items-center gap-3 md:col-span-2">
        <button
          type="submit"
          disabled={busy}
          className="min-h-11 rounded-full bg-panel px-5 text-body-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? "Saving..." : "Apply override"}
        </button>
        {message && <p className={`text-caption ${message.ok ? "text-success-strong" : "text-red-fg"}`}>{message.text}</p>}
      </div>
    </form>
  );
}
