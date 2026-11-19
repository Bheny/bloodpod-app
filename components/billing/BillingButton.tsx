"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

/** Posts to a billing endpoint that returns { url } and sends the person there. */
export function BillingButton({
  endpoint,
  children,
  variant = "primary",
}: {
  endpoint: "/api/billing/checkout" | "/api/billing/manage";
  children: React.ReactNode;
  variant?: "primary" | "quiet";
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error ?? "Something went wrong. Please try again.");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div>
      {variant === "primary" ? (
        <Button onClick={go} loading={busy} size="lg" className="w-full">
          {children}
        </Button>
      ) : (
        <button
          type="button"
          onClick={go}
          disabled={busy}
          className="w-full rounded-full bg-surface px-5 py-3 text-body-sm font-bold text-ink-mid transition-colors hover:bg-hairline disabled:opacity-50"
        >
          {busy ? "Opening…" : children}
        </button>
      )}
      {error && <p className="mt-2 text-center text-caption text-red-fg">{error}</p>}
    </div>
  );
}
