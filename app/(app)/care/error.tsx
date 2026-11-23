"use client";

import { Button } from "@/components/ui/Button";

export default function CareError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <p className="text-title font-extrabold text-ink">Could not load this page</p>
      <p className="max-w-xs text-body-sm text-ink-muted">Check your connection and try again. Nothing you entered was lost.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
