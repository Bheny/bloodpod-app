"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { HomeNudge } from "@/lib/nudges";

/**
 * One friendly prompt on Home. The button is a plain link on purpose: it goes through /api/nudges/[id]/go,
 * which notes that it worked, so it must not be prefetched the way a Next link would be.
 */
export function NudgeCard({ nudge }: { nudge: HomeNudge }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  function dismiss() {
    setHidden(true);
    void fetch(`/api/nudges/${nudge.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dismissed" }),
      keepalive: true,
    }).catch(() => {});
  }

  return (
    <section
      aria-label="A little nudge"
      className="relative rounded-3xl border-[0.5px] border-hairline bg-card p-4 shadow-raised lg:rounded-2xl lg:p-6"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Not now"
        className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface"
      >
        <X className="size-4" aria-hidden="true" />
      </button>

      <p className="text-label font-bold uppercase tracking-[1.5px] text-red-fg">A little nudge</p>
      <p className="mt-1 pr-8 text-body-sm font-bold text-ink lg:text-body">{nudge.title}</p>
      <p className="mt-1 text-caption leading-relaxed text-ink-muted lg:text-body-sm">{nudge.body}</p>

      <div className="mt-3 flex items-center gap-4">
        <a
          href={nudge.cta.href}
          className="inline-flex min-h-10 items-center rounded-full bg-red px-5 text-caption font-bold text-white transition-transform active:scale-[0.98]"
        >
          {nudge.cta.label}
        </a>
        <button type="button" onClick={dismiss} className="min-h-10 text-caption font-bold text-ink-muted">
          Not now
        </button>
      </div>
    </section>
  );
}
