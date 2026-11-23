"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PushToggle } from "@/components/pwa/PushToggle";
import { Button } from "@/components/ui/Button";
import type { StepState } from "@/lib/get-started";

async function record(body: Record<string, string>) {
  try {
    await fetch("/api/get-started", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      // The page may be navigating away as this goes out.
      keepalive: true,
    });
  } catch {
    // Nothing here is worth interrupting the person for.
  }
}

/** The one button for a step: turn on alerts in place, or go to the screen where it is done. */
export function StepActions({ step, size = "default" }: { step: StepState; size?: "default" | "sm" }) {
  const router = useRouter();
  const [skipping, setSkipping] = useState(false);

  async function skip() {
    setSkipping(true);
    await record({ action: "seen", step: step.id });
    router.refresh();
    setSkipping(false);
  }

  if (step.done) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      {step.push ? (
        <div className="w-full">
          <PushToggle />
        </div>
      ) : (
        <Button asChild size={size}>
          <Link href={step.href} onClick={() => step.markSeenOnOpen && void record({ action: "seen", step: step.id })}>
            {step.cta}
          </Link>
        </Button>
      )}
      {!step.markSeenOnOpen && (
        <button
          type="button"
          onClick={skip}
          disabled={skipping}
          className="text-caption font-semibold text-ink-muted underline-offset-2 hover:underline disabled:opacity-60"
        >
          Skip for now
        </button>
      )}
    </div>
  );
}

/** Hide the card from Home, or bring it back. */
export function GetStartedVisibility({ dismissed, label }: { dismissed: boolean; label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await record({ action: dismissed ? "restore" : "dismiss" });
    router.refresh();
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className="text-caption font-semibold text-ink-muted underline-offset-2 hover:underline disabled:opacity-60"
    >
      {label ?? (dismissed ? "Show on Home" : "Hide from Home")}
    </button>
  );
}
