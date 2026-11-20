"use client";

import { useState } from "react";
import { HandHeart } from "lucide-react";
import { REQUEST_RULES } from "@/lib/donor-requests-rules";

/** Ask one donor for help. They see your first name and this note, and nothing else until they say yes. */
export function AskButton({ donorId, firstName }: { donorId: string; firstName: string | null }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/discover/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorId, message: message.trim() || undefined }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setSent(true);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <p className="mt-3 rounded-2xl bg-success-soft px-3 py-2.5 text-caption font-semibold text-success-strong" role="status">
        Request sent. {firstName ?? "They"} will be asked, and you will hear back.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-red px-5 text-body-sm font-bold text-white transition-transform active:scale-[0.98] motion-reduce:transition-none"
      >
        <HandHeart className="size-4" aria-hidden /> Ask {firstName ?? "this donor"} for help
      </button>
    );
  }

  return (
    <form onSubmit={send} className="mt-3 space-y-2.5">
      <label htmlFor={`ask-${donorId}`} className="block text-caption font-semibold text-ink-mid">
        A short note (optional)
      </label>
      <textarea
        id={`ask-${donorId}`}
        rows={2}
        maxLength={REQUEST_RULES.messageMax}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Who needs help, and roughly when"
        className="w-full resize-none rounded-xl border border-hairline bg-card px-3 py-2 text-body-sm text-ink focus:border-red focus:outline-none"
      />
      <p className="text-caption text-ink-muted">
        {firstName ?? "They"} sees your first name and this note. Your full name and number are shared only if they say yes.
      </p>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="min-h-11 flex-1 rounded-full bg-red px-5 text-body-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? "Sending..." : "Send request"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="min-h-11 px-4 text-body-sm font-semibold text-ink-mid">
          Cancel
        </button>
      </div>
      {error && (
        <p role="alert" className="text-caption text-red-fg">
          {error}
        </p>
      )}
    </form>
  );
}
