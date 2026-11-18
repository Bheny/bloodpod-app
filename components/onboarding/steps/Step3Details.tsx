"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock, Lock } from "lucide-react";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { normalizeGhanaPhone } from "@/lib/phone";
import { computeEligibility } from "@/lib/eligibility";

const today = () => new Date().toISOString().slice(0, 10);

// Asks only for what the account is still missing, so people who answered the
// donation question on /start are not asked twice.
export function Step3Details({
  needPhone,
  needDonation,
  onNext,
}: {
  needPhone: boolean;
  needDonation: boolean;
  onNext: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [neverDonated, setNeverDonated] = useState(false);
  const [lastDonated, setLastDonated] = useState("");
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneOk = !needPhone || normalizeGhanaPhone(phone) !== null;
  const dateOk = !needDonation || neverDonated || (lastDonated !== "" && lastDonated <= today());

  const eligibility = useMemo(() => {
    if (!needDonation) return null;
    if (neverDonated) return { kind: "ready" as const };
    if (!lastDonated || lastDonated > today()) return null;
    const e = computeEligibility(new Date(lastDonated));
    return e.isEligible
      ? { kind: "ready" as const }
      : {
          kind: "wait" as const,
          date: e.nextEligible!.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
        };
  }, [needDonation, neverDonated, lastDonated]);

  async function submit() {
    setTouched(true);
    if (!phoneOk || !dateOk) return;
    setSaving(true);
    setError(null);

    const body: Record<string, unknown> = {};
    if (needPhone) body.phone = phone;
    if (needDonation) {
      body.neverDonated = neverDonated;
      if (!neverDonated) body.lastDonated = lastDonated;
    }

    try {
      const res = await fetch("/api/onboarding/details", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not save. Please try again.");
        setSaving(false);
        return;
      }
    } catch {
      setError("Could not save. Check your connection and try again.");
      setSaving(false);
      return;
    }
    setSaving(false);
    onNext();
  }

  const title = needPhone && needDonation ? "How can we reach you?" : needPhone ? "What's your number?" : "When did you last donate?";
  const lead = needPhone
    ? "So we can reach you the moment your blood type is needed."
    : "So we only alert you when you can actually help.";

  return (
    <div className="flex flex-1 flex-col px-6 py-10">
      <div className="flex-1">
        <p className="text-[11px] font-bold uppercase tracking-[2px] text-red">About you</p>
        <h1 className="mt-3 text-[22px] font-extrabold tracking-[-0.6px] text-ink">{title}</h1>
        <p className="mt-2 text-sm text-ink-muted">{lead}</p>

        <div className="mt-6 flex flex-col gap-5">
          {needPhone && (
            <Field
              label="Mobile number"
              id="phone"
              error={touched && !phoneOk ? "Enter a Ghana mobile number, like 024 123 4567" : undefined}
            >
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="024 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={touched && !phoneOk ? "invalid" : undefined}
              />
              <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                <Lock className="size-3 shrink-0" /> Shared only if you say Yes to an alert.
              </p>
            </Field>
          )}

          {needDonation && (
            <Field
              label="When did you last donate blood?"
              id="lastDonated"
              error={touched && !dateOk ? "Pick a date, or tick that you have never donated" : undefined}
            >
              <Input
                id="lastDonated"
                type="date"
                max={today()}
                disabled={neverDonated}
                value={neverDonated ? "" : lastDonated}
                onChange={(e) => setLastDonated(e.target.value)}
                error={touched && !dateOk ? "invalid" : undefined}
              />
              <label className="mt-1 flex cursor-pointer items-center gap-2 text-sm text-ink-mid">
                <input
                  type="checkbox"
                  checked={neverDonated}
                  onChange={(e) => setNeverDonated(e.target.checked)}
                  className="size-4 accent-[#dd0000]"
                />
                I have never donated blood
              </label>
            </Field>
          )}

          {eligibility && (
            <div
              className={
                eligibility.kind === "ready"
                  ? "flex gap-3 rounded-card bg-[#F0FBF3] p-4"
                  : "flex gap-3 rounded-card bg-surface p-4"
              }
              aria-live="polite"
            >
              {eligibility.kind === "ready" ? (
                <CheckCircle2 className="size-5 shrink-0 text-[#1FA855]" />
              ) : (
                <Clock className="size-5 shrink-0 text-ink-muted" />
              )}
              <p className="text-sm text-ink-mid">
                {eligibility.kind === "ready" ? (
                  <>
                    <span className="font-bold text-ink">You can donate now.</span> We&apos;ll alert you when your
                    type is needed.
                  </>
                ) : (
                  <>
                    <span className="font-bold text-ink">Eligible again on {eligibility.date}.</span> We won&apos;t
                    alert you until then, so your body gets the rest it needs.
                  </>
                )}
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red">{error}</p>}
        </div>
      </div>

      <Button onClick={submit} loading={saving} size="lg" className="mt-8 w-full">
        Continue
      </Button>
    </div>
  );
}
