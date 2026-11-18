"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { LogoMark } from "@/components/ui/Logo";
import { clearStartState, isStartComplete, readStartState } from "@/lib/start-state";

// Saves the answers from /start once the person has an account, then reloads so
// the server renders onboarding from the right step. Renders nothing it cannot
// trust until that has happened, so no step flashes before being skipped.
export function ImportGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const state = readStartState();
    if (!isStartComplete(state)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only check
      setReady(true);
      return;
    }

    fetch("/api/onboarding/import", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    })
      .then((res) => {
        clearStartState(); // never retry: a bad payload would loop forever
        if (res.ok) window.location.reload();
        else setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
        <LogoMark className="size-10" />
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <Loader2 className="size-4 animate-spin" /> Saving your Blood Card...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
