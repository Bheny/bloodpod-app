"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const POINTS = [
  "If someone near you needs your blood type, you get one alert.",
  "You can say No. You get at most 3 non-critical alerts a day.",
  "Your name and number go to the person asking only after you say Yes.",
  "You are never alerted within 3 months of a donation.",
];

export function Step5Consent({ onNext }: { onNext: () => void }) {
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/consent", { method: "PUT" });
      if (!res.ok) throw new Error();
    } catch {
      setError("Could not save. Please try again.");
      setSaving(false);
      return;
    }
    setSaving(false);
    onNext();
  }

  return (
    <div className="flex flex-1 flex-col px-6 py-10">
      <div className="flex-1">
        <p className="text-[11px] font-bold uppercase tracking-[2px] text-red">Your choice</p>
        <h1 className="mt-3 text-[22px] font-extrabold tracking-[-0.6px] text-ink">
          Here&apos;s exactly what you&apos;re agreeing to.
        </h1>
        <p className="mt-2 text-sm text-ink-muted">Trust matters most here, so there is no fine print.</p>

        <ul className="mt-6 space-y-3">
          {POINTS.map((p) => (
            <li key={p} className="flex gap-3 text-sm leading-relaxed text-ink-mid">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-red-light">
                <Check className="size-3 text-red" />
              </span>
              {p}
            </li>
          ))}
        </ul>

        <button
          type="button"
          role="checkbox"
          aria-checked={agreed}
          onClick={() => setAgreed((v) => !v)}
          className={cn(
            "mt-7 flex w-full items-start gap-3 rounded-card border-[1.5px] p-4 text-left transition-colors",
            agreed ? "border-red bg-red-light" : "border-[#E5E5EA] bg-white hover:border-red-mid",
          )}
        >
          <span
            className={cn(
              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-[1.5px]",
              agreed ? "border-red bg-red" : "border-ink-faint bg-white",
            )}
          >
            {agreed && <Check className="size-3.5 text-white" />}
          </span>
          <span className="text-sm font-semibold text-ink">
            I agree to be contacted about blood emergencies near me.
          </span>
        </button>
        <p className="mt-2 text-xs text-ink-muted">You can turn this off any time in your profile.</p>
        {error && <p className="mt-2 text-sm text-red">{error}</p>}
      </div>

      <Button onClick={submit} disabled={!agreed} loading={saving} size="lg" className="mt-8 w-full">
        Count me in
      </Button>
    </div>
  );
}
