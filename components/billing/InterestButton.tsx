"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

/**
 * The subscribe button while payments are still being set up. It records interest
 * and tells the person we'll let them know, so no one is left at a dead end.
 */
export function InterestButton({
  plan = "CARE",
  planName = "the Care Pod",
  label,
  initiallyInterested,
  variant = "primary",
}: {
  plan?: "BASIC" | "PLUS" | "CARE";
  planName?: string;
  label: string;
  initiallyInterested: boolean;
  variant?: "primary" | "secondary";
}) {
  const [open, setOpen] = useState(false);
  const [interested, setInterested] = useState(initiallyInterested);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function record() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error();
      setInterested(true);
    } catch {
      setError("Couldn't save that. Please try again.");
    }
    setBusy(false);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="lg" variant={variant} className="w-full">
        {interested ? "You're on the list" : label}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)}>
        {interested ? (
          <div className="flex flex-col items-center py-2 text-center">
            <CheckCircle2 className="size-11 text-[#1FA855]" />
            <p className="mt-3 text-title font-bold text-ink">You&apos;re on the list</p>
            <p className="mt-1 text-body-sm text-ink-muted">
              Thanks. We&apos;ll let you know as soon as you can subscribe to {planName}.
            </p>
            <Button onClick={() => setOpen(false)} size="lg" className="mt-5 w-full">
              Done
            </Button>
          </div>
        ) : (
          <div>
            <p className="pr-10 text-title font-bold text-ink">Payments open soon</p>
            <p className="mt-1 text-body-sm text-ink-muted">
              We&apos;re still setting up payments, so you can&apos;t subscribe just yet. Want us to let you know the
              moment {planName} is ready? It&apos;s one tap, and you won&apos;t be charged anything.
            </p>
            {error && <p className="mt-2 text-caption text-red-fg">{error}</p>}
            <div className="mt-5 flex gap-2">
              <Button onClick={record} loading={busy} size="lg" className="flex-1">
                Yes, let me know
              </Button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-surface px-5 text-body-sm font-semibold text-ink-mid hover:bg-hairline"
              >
                Not now
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
