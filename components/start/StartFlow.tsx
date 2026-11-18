"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { ArrowLeft, BellRing, CheckCircle2, Clock, MapPin } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { computeEligibility } from "@/lib/eligibility";
import { nearestCity } from "@/lib/nearest-city";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { cn } from "@/lib/utils";
import { EMPTY_START, readStartState, writeStartState, type StartState } from "@/lib/start-state";
import type { BloodType } from "@prisma/client";

const TYPES: { label: string; value: BloodType; note?: string }[] = [
  { label: "A+", value: "A_POS" },
  { label: "A−", value: "A_NEG" },
  { label: "B+", value: "B_POS" },
  { label: "B−", value: "B_NEG" },
  { label: "O+", value: "O_POS", note: "most common" },
  { label: "O−", value: "O_NEG", note: "universal donor" },
  { label: "AB+", value: "AB_POS" },
  { label: "AB−", value: "AB_NEG" },
];

const TOTAL = 4;
const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export function StartFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invite = searchParams.get("invite");

  const [step, setStep] = useState(0);
  const [state, setState] = useState<StartState>(EMPTY_START);
  const [loaded, setLoaded] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [locating, setLocating] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<{ pod: string; inviter: string | null } | null>(null);

  // Returning visitors keep their earlier answers.
  useEffect(() => {
    const saved = readStartState();
    /* eslint-disable react-hooks/set-state-in-effect -- browser-only restore */
    if (saved) {
      setState(saved);
      setCityInput(saved.city ?? "");
    }
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!invite) return;
    fetch(`/api/invite/${invite}`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setInviteInfo({ pod: data.pod.name, inviter: data.inviter.name });
      })
      .catch(() => {});
  }, [invite]);

  function update(patch: Partial<StartState>) {
    setState((prev) => {
      const next = { ...prev, ...patch };
      writeStartState(next);
      return next;
    });
  }

  const eligibility = useMemo(() => {
    if (state.neverDonated) return { eligible: true as const };
    if (!state.lastDonated || state.lastDonated > today()) return null;
    const e = computeEligibility(new Date(state.lastDonated));
    return e.isEligible ? { eligible: true as const } : { eligible: false as const, date: fmtDate(e.nextEligible!) };
  }, [state.neverDonated, state.lastDonated]);

  const next = () => setStep((s) => Math.min(TOTAL - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  function useMyLocation() {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const city = nearestCity(latitude, longitude);
        setCityInput(city);
        update({ city, latitude, longitude });
        setLocating(false);
        setTimeout(next, 600);
      },
      () => setLocating(false),
      { timeout: 8000 },
    );
  }

  const signUpHref = `/sign-up?from=start${invite ? `&invite=${encodeURIComponent(invite)}` : ""}`;
  const typeLabel = state.bloodType ? BLOOD_TYPE_LABELS[state.bloodType as BloodType] : null;

  if (!loaded) return <div className="min-h-screen bg-white" />;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-white px-6 py-6">
      <div className="flex items-center justify-between">
        {step > 0 ? (
          <button
            type="button"
            aria-label="Back"
            onClick={back}
            className="-ml-2 flex size-9 items-center justify-center rounded-full text-ink-mid hover:bg-surface"
          >
            <ArrowLeft className="size-5" />
          </button>
        ) : (
          <Link href="/" aria-label="BloodPod home">
            <Logo />
          </Link>
        )}

        <div
          className="flex items-center gap-1.5"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={TOTAL}
          aria-valuenow={step + 1}
          aria-label={`Step ${step + 1} of ${TOTAL}`}
        >
          {Array.from({ length: TOTAL }, (_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === step ? 18 : 6,
                backgroundColor: i < step ? "rgba(221,0,0,0.4)" : i === step ? "#DD0000" : "#E5E5EA",
              }}
            />
          ))}
        </div>
        <span className="w-9" />
      </div>

      {inviteInfo && (
        <p className="mt-4 rounded-xl bg-red-light px-3 py-2.5 text-xs font-semibold text-red">
          You&apos;re invited to join {inviteInfo.pod}
          {inviteInfo.inviter ? ` by ${inviteInfo.inviter}` : ""}. Answer three quick questions first.
        </p>
      )}

      <AnimatePresence mode="wait">
        <m.div
          key={step}
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -32 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-1 flex-col pt-8"
        >
          {step === 0 && (
            <>
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[2px] text-red">Step 1 of 3 · no account needed</p>
                <h1 className="mt-3 text-[26px] font-extrabold leading-[1.15] tracking-[-0.8px] text-ink">
                  What&apos;s your blood type?
                </h1>
                <p className="mt-2 text-sm text-ink-muted">
                  Hospitals match on this, so it is the one thing we need to start.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-2.5">
                  {TYPES.map((t) => {
                    const on = state.bloodType === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => update({ bloodType: t.value })}
                        className={cn(
                          "rounded-xl border-[1.5px] py-3.5 text-center text-lg font-bold transition-colors",
                          on ? "border-red bg-red-light text-red" : "border-[#E5E5EA] bg-white text-ink hover:border-red-mid",
                        )}
                      >
                        {t.label}
                        {t.note && <span className="mt-0.5 block text-[10px] font-medium text-ink-muted">({t.note})</span>}
                      </button>
                    );
                  })}
                </div>

                <p className="mt-4 text-center text-sm text-ink-muted">
                  Not sure?{" "}
                  <button
                    type="button"
                    onClick={() => router.push(signUpHref)}
                    className="font-semibold text-red underline-offset-2 hover:underline"
                  >
                    Create an account and add it later
                  </button>
                </p>
              </div>
              <Button onClick={next} disabled={!state.bloodType} size="lg" className="mt-8 w-full">
                Continue
              </Button>
            </>
          )}

          {step === 1 && (
            <>
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[2px] text-red">Step 2 of 3</p>
                <h1 className="mt-3 text-[26px] font-extrabold leading-[1.15] tracking-[-0.8px] text-ink">
                  When did you last donate?
                </h1>
                <p className="mt-2 text-sm text-ink-muted">So we only alert you when you can actually help.</p>

                <div className="mt-6 flex flex-col gap-3">
                  <Input
                    type="date"
                    max={today()}
                    aria-label="Last donation date"
                    disabled={state.neverDonated}
                    value={state.neverDonated ? "" : (state.lastDonated ?? "")}
                    onChange={(e) => update({ lastDonated: e.target.value || null })}
                  />
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-mid">
                    <input
                      type="checkbox"
                      checked={state.neverDonated}
                      onChange={(e) => update({ neverDonated: e.target.checked, lastDonated: null })}
                      className="size-4 accent-[#dd0000]"
                    />
                    I have never donated blood
                  </label>

                  {eligibility && (
                    <div
                      className={cn("flex gap-3 rounded-card p-4", eligibility.eligible ? "bg-[#F0FBF3]" : "bg-surface")}
                      aria-live="polite"
                    >
                      {eligibility.eligible ? (
                        <CheckCircle2 className="size-5 shrink-0 text-[#1FA855]" />
                      ) : (
                        <Clock className="size-5 shrink-0 text-ink-muted" />
                      )}
                      <p className="text-sm text-ink-mid">
                        {eligibility.eligible ? (
                          <>
                            <span className="font-bold text-ink">You can donate now.</span> You would be on the list the
                            moment your type is needed.
                          </>
                        ) : (
                          <>
                            <span className="font-bold text-ink">Eligible again on {eligibility.date}.</span> We
                            won&apos;t alert you until then.
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <Button
                onClick={next}
                disabled={!state.neverDonated && !(state.lastDonated && state.lastDonated <= today())}
                size="lg"
                className="mt-8 w-full"
              >
                Continue
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[2px] text-red">Step 3 of 3</p>
                <h1 className="mt-3 text-[26px] font-extrabold leading-[1.15] tracking-[-0.8px] text-ink">
                  Where are you?
                </h1>
                <p className="mt-2 text-sm text-ink-muted">
                  Only to match you with emergencies close to you, never to track you.
                </p>

                <Button onClick={useMyLocation} loading={locating} variant="secondary" className="mt-6 w-full">
                  <MapPin className="size-4" /> Use my location
                </Button>

                <div className="my-5 flex items-center gap-3 text-[13px] text-ink-faint">
                  <div className="h-px flex-1 bg-[#E5E5EA]" />
                  or type your city
                  <div className="h-px flex-1 bg-[#E5E5EA]" />
                </div>

                <Input
                  placeholder="Accra"
                  aria-label="Your city"
                  value={cityInput}
                  onChange={(e) => {
                    setCityInput(e.target.value);
                    update({ city: e.target.value.trim() || null, latitude: undefined, longitude: undefined });
                  }}
                />
              </div>
              <Button onClick={next} disabled={!state.city || state.city.length < 2} size="lg" className="mt-8 w-full">
                See my Blood Card
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[2px] text-red">Here it is</p>
                <h1 className="mt-3 text-[26px] font-extrabold leading-[1.15] tracking-[-0.8px] text-ink">
                  Your Blood Card.
                </h1>

                <m.div
                  initial={{ opacity: 0, y: 20, rotate: -3 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 160, damping: 16 }}
                  className="mt-5 rounded-card border border-white/10 bg-ink p-6 text-white shadow-[0_24px_48px_-16px_rgba(28,28,30,0.5)]"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[2px] text-white/50">Blood Card</span>
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white/70">
                      Self-reported
                    </span>
                  </div>
                  <div className="mt-5 text-[56px] font-extrabold leading-none tracking-tight text-red">{typeLabel}</div>
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-white/60">
                    <MapPin className="size-3.5" /> {state.city}
                  </p>
                  <div className="my-5 h-px bg-white/10" />
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[11px] text-white/50">Last donation</p>
                      <p className="text-sm font-bold">
                        {state.neverDonated ? "Never" : state.lastDonated ? fmtDate(new Date(state.lastDonated)) : "-"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-white/50">Next eligible</p>
                      <p className={cn("text-sm font-bold", eligibility?.eligible === false ? "text-white" : "text-[#34C759]")}>
                        {eligibility?.eligible === false ? eligibility.date : "Now"}
                      </p>
                    </div>
                  </div>
                </m.div>

                <m.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="mt-4 flex items-start gap-3 rounded-card border-[0.5px] border-[#E5E5EA] bg-white p-4"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-light">
                    <BellRing className="size-[18px] text-red" />
                  </span>
                  <p className="text-sm leading-relaxed text-ink-mid">
                    <span className="font-bold text-ink">What happens next:</span> when {typeLabel} blood is needed near{" "}
                    {state.city}, you get an alert and answer Yes or No. Your number is shared only if you say Yes.
                  </p>
                </m.div>
              </div>

              <Button asChild size="lg" className="mt-8 w-full">
                <Link href={signUpHref}>Save my Blood Card</Link>
              </Button>
              <p className="mt-3 text-center text-xs text-ink-muted">Free for donors. We&apos;ll ask for your name and email next.</p>
            </>
          )}
        </m.div>
      </AnimatePresence>
    </div>
  );
}
