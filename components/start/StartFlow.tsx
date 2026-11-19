"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { ArrowLeft, BellRing, CheckCircle2, Clock, MapPin } from "lucide-react";
import { BloodTypeHelp } from "@/components/shared/BloodTypeHelp";
import { IntroStory } from "@/components/start/IntroStory";
import { Logo } from "@/components/ui/Logo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { computeEligibility } from "@/lib/eligibility";
import { nearestCity } from "@/lib/nearest-city";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { cn } from "@/lib/utils";
import { EMPTY_START, clearStartState, isStartComplete, readStartState, writeStartState, type StartState } from "@/lib/start-state";
import { canDonateTo } from "@/lib/blood-compatibility";
import { POD_READY_THRESHOLD } from "@/components/dashboard/PodReadyCard";
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

// Screen 0 is the "be ready" pitch. Screens 1-3 are the questions, 4 is the Blood Card.
// Only 1-4 get progress dots.
const CARD_STEP = 4;
const DOTS = 4;
const ALL_TYPES = TYPES.map((t) => t.value);

/** Who this blood type can give to, and who can give to it, from the real compatibility table. */
function compat(type: BloodType) {
  return {
    giveTo: ALL_TYPES.filter((r) => canDonateTo(type, r)),
    receiveFrom: ALL_TYPES.filter((d) => canDonateTo(d, type)),
  };
}

const today = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

// Most people know roughly, not exactly. Each range maps to the most recent date it could mean,
// so we never count on someone sooner than we should.
const DONATED_OPTIONS: { id: string; label: string; days: number }[] = [
  { id: "never", label: "Never", days: 0 },
  { id: "m0", label: "In the last month", days: 0 },
  { id: "m1", label: "1 to 2 months ago", days: 30 },
  { id: "m2", label: "2 to 3 months ago", days: 60 },
  { id: "m3", label: "3 to 6 months ago", days: 100 },
  { id: "m6", label: "6 to 12 months ago", days: 182 },
  { id: "y1", label: "Over a year ago", days: 365 },
  { id: "unsure", label: "I'm not sure", days: 0 },
];
const fmtDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/**
 * `signedIn` is for someone who already has an account (for example after Google sign-up) but
 * hasn't answered yet: same story and questions, but the last button saves instead of signing up.
 */
export function StartFlow({ signedIn = false }: { signedIn?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invite = searchParams.get("invite");

  const [step, setStep] = useState(0);
  const [state, setState] = useState<StartState>(EMPTY_START);
  const [loaded, setLoaded] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<{ pod: string; inviter: string | null } | null>(null);

  // Returning visitors keep their earlier answers.
  useEffect(() => {
    const saved = readStartState();
    /* eslint-disable react-hooks/set-state-in-effect -- browser-only restore */
    if (saved) {
      setState(saved);
      setCityInput(saved.city ?? "");
      // Someone who finished earlier goes straight back to their card.
      if (isStartComplete(saved)) setStep(CARD_STEP);
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

  // Older saved answers have no choice recorded, so work it out from what they did save.
  const donatedChoice = state.donatedChoice ?? (state.neverDonated ? "never" : state.lastDonated ? "exact" : null);

  const eligibility = useMemo(() => {
    if (state.neverDonated) return { eligible: true as const };
    if (!state.lastDonated || state.lastDonated > today()) return null;
    const e = computeEligibility(new Date(state.lastDonated));
    return e.isEligible ? { eligible: true as const } : { eligible: false as const, date: fmtDate(e.nextEligible!) };
  }, [state.neverDonated, state.lastDonated]);

  const next = () => setStep((s) => Math.min(CARD_STEP, s + 1));
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

  async function saveAnswers() {
    setSaving(true);
    setSaveError(false);
    try {
      const res = await fetch("/api/onboarding/import", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      if (!res.ok) throw new Error("save failed");
      clearStartState();
      window.location.reload();
    } catch {
      setSaveError(true);
      setSaving(false);
    }
  }

  const signUpHref = `/sign-up?from=start${invite ? `&invite=${encodeURIComponent(invite)}` : ""}`;
  const typeLabel = state.bloodType ? BLOOD_TYPE_LABELS[state.bloodType as BloodType] : null;
  const unknownType = !!state.bloodTypeUnknown && !state.bloodType;

  if (!loaded) return <div className="force-light min-h-screen bg-card" />;

  return (
    <div className="force-light mx-auto flex h-dvh w-full max-w-[480px] flex-col bg-card px-6 py-5">
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

        {step > 0 ? (
          <div
            className="flex items-center gap-1.5"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={DOTS}
            aria-valuenow={step}
            aria-label={`Step ${step} of ${DOTS}`}
          >
            {Array.from({ length: DOTS }, (_, i) => i + 1).map((dot) => (
              <span
                key={dot}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: dot === step ? 18 : 6,
                  backgroundColor: dot < step ? "rgba(221,0,0,0.4)" : dot === step ? "#DD0000" : "var(--color-hairline)",
                }}
              />
            ))}
          </div>
        ) : (
          <span />
        )}
        <span className="w-9" />
      </div>

      {/* You, in your network: fills in as each answer is given, so every answer visibly changes something. */}
      {step >= 1 && step <= 3 && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-surface px-3.5 py-3" aria-live="polite">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold transition-colors",
              typeLabel ? "bg-red text-white" : unknownType ? "bg-fill text-ink-mid" : "border-[1.5px] border-dashed border-ink-faint/60 text-ink-faint",
            )}
          >
            {typeLabel ?? (unknownType ? "?" : "You")}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink">You, in your network</p>
            <p className="truncate text-xs text-ink-muted">
              {[
                typeLabel ?? (unknownType ? "Blood type to add" : null),
                state.city,
                eligibility ? (eligibility.eligible ? "Available to donate" : `Back ${eligibility.date}`) : null,
              ]
                .filter(Boolean)
                .join(" · ") || "Answer below and watch this fill in"}
            </p>
          </div>
        </div>
      )}

      {inviteInfo && (
        <p className="mt-4 rounded-xl bg-red-light px-3 py-2.5 text-xs font-semibold text-red-fg">
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
          className="flex min-h-0 flex-1 flex-col pt-6"
        >
          {step === 0 && <IntroStory onDone={next} signedIn={signedIn} />}

          {step === 1 && (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <p className="text-[11px] font-bold uppercase tracking-[2px] text-red-fg">Step 1 of 3</p>
                <h1 className="mt-3 text-[26px] font-extrabold leading-[1.15] tracking-[-0.8px] text-ink">
                  What&apos;s your blood type?
                </h1>
                <p className="mt-2 text-sm text-ink-muted">
                  Hospitals match on this. It decides who you can help.
                </p>

                <div className="mt-6 grid grid-cols-2 gap-2.5">
                  {TYPES.map((t) => {
                    const on = state.bloodType === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => update({ bloodType: t.value, bloodTypeUnknown: false })}
                        className={cn(
                          "rounded-xl border-[1.5px] py-3.5 text-center text-lg font-bold transition-colors",
                          on ? "border-red bg-red-light text-red-fg" : "border-hairline bg-card text-ink hover:border-red-mid",
                        )}
                      >
                        {t.label}
                        {t.note && <span className="mt-0.5 block text-[10px] font-medium text-ink-muted">({t.note})</span>}
                      </button>
                    );
                  })}
                </div>

                {state.bloodType && (
                  <m.div
                    key={state.bloodType}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-card bg-success-soft p-4 text-sm leading-relaxed text-ink-mid"
                    aria-live="polite"
                  >
                    <p>
                      <span className="font-bold text-ink">
                        {compat(state.bloodType as BloodType).giveTo.length === ALL_TYPES.length
                          ? "You can give to anyone."
                          : `You can give to ${compat(state.bloodType as BloodType).giveTo.length} of 8 blood types.`}
                      </span>{" "}
                      {compat(state.bloodType as BloodType)
                        .giveTo.map((t) => BLOOD_TYPE_LABELS[t])
                        .join(", ")}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      You can receive from{" "}
                      {compat(state.bloodType as BloodType)
                        .receiveFrom.map((t) => BLOOD_TYPE_LABELS[t])
                        .join(", ")}
                      .
                    </p>
                  </m.div>
                )}

                <button
                  type="button"
                  aria-pressed={unknownType}
                  onClick={() => update({ bloodType: null, bloodTypeUnknown: !unknownType })}
                  className={cn(
                    "mt-3 w-full rounded-xl border-[1.5px] px-4 py-3 text-center text-sm font-semibold transition-colors",
                    unknownType ? "border-red bg-red-light text-red-fg" : "border-hairline bg-card text-ink hover:border-red-mid",
                  )}
                >
                  I don&apos;t know my blood type
                </button>

                {unknownType && (
                  <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                    <BloodTypeHelp />
                  </m.div>
                )}
              </div>
              <Button onClick={next} disabled={!state.bloodType && !unknownType} size="lg" className="mt-4 w-full shrink-0">
                Continue
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <p className="text-[11px] font-bold uppercase tracking-[2px] text-red-fg">Step 2 of 3</p>
                <h1 className="mt-3 text-[26px] font-extrabold leading-[1.15] tracking-[-0.8px] text-ink">
                  When did you last donate?
                </h1>
                <p className="mt-2 text-sm text-ink-muted">
                  A rough idea is fine. It keeps your network from counting on you too soon.
                </p>

                <div className="mt-5 flex flex-col gap-2" role="radiogroup" aria-label="When you last donated">
                  {DONATED_OPTIONS.map((o) => {
                    const on = donatedChoice === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() =>
                          update({
                            donatedChoice: o.id,
                            neverDonated: o.id === "never",
                            lastDonated: o.id === "never" ? null : daysAgoISO(o.days),
                          })
                        }
                        className={cn(
                          "flex items-center justify-between rounded-xl border-[1.5px] px-4 py-3 text-left text-sm font-semibold transition-colors",
                          on ? "border-red bg-red-light text-red-fg" : "border-hairline bg-card text-ink hover:border-red-mid",
                        )}
                      >
                        {o.label}
                        {on && <CheckCircle2 className="size-4" />}
                      </button>
                    );
                  })}

                  {donatedChoice === "exact" ? (
                    <Input
                      type="date"
                      max={today()}
                      aria-label="Last donation date"
                      value={state.lastDonated ?? ""}
                      onChange={(e) => update({ lastDonated: e.target.value || null })}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => update({ donatedChoice: "exact", neverDonated: false, lastDonated: null })}
                      className="mt-1 text-center text-sm font-semibold text-ink-muted underline-offset-2 hover:underline"
                    >
                      I remember the exact date
                    </button>
                  )}

                  {eligibility && (
                    <div
                      className={cn("flex gap-3 rounded-card p-4", eligibility.eligible ? "bg-success-soft" : "bg-surface")}
                      aria-live="polite"
                    >
                      {eligibility.eligible ? (
                        <CheckCircle2 className="size-5 shrink-0 text-[#1FA855]" />
                      ) : (
                        <Clock className="size-5 shrink-0 text-ink-muted" />
                      )}
                      <p className="text-sm text-ink-mid">
                        {donatedChoice === "unsure" ? (
                          <>
                            <span className="font-bold text-ink">No problem. We&apos;ll play it safe.</span> We&apos;ll hold
                            alerts for now, and you can correct this later.
                          </>
                        ) : eligibility.eligible ? (
                          <>
                            <span className="font-bold text-ink">You can donate now.</span> You would be on the list the
                            moment your type is needed.
                          </>
                        ) : (
                          <>
                            <span className="font-bold text-ink">
                              Eligible again {donatedChoice === "exact" ? "on" : "around"} {eligibility.date}.
                            </span>{" "}
                            We won&apos;t count on you until then.
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <Button
                onClick={next}
                disabled={!donatedChoice || (donatedChoice === "exact" && !(state.lastDonated && state.lastDonated <= today()))}
                size="lg"
                className="mt-8 w-full"
              >
                Continue
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <p className="text-[11px] font-bold uppercase tracking-[2px] text-red-fg">Step 3 of 3</p>
                <h1 className="mt-3 text-[26px] font-extrabold leading-[1.15] tracking-[-0.8px] text-ink">
                  Where are you?
                </h1>
                <p className="mt-2 text-sm text-ink-muted">
                  {typeLabel ? `So ${typeLabel} requests near you reach you first.` : unknownType ? "So your network can see who is close." : "So requests near you reach you first."}{" "}
                  We never track you.
                </p>

                <Button onClick={useMyLocation} loading={locating} variant="secondary" className="mt-6 w-full">
                  <MapPin className="size-4" /> Use my location
                </Button>

                <div className="my-5 flex items-center gap-3 text-[13px] text-ink-faint">
                  <div className="h-px flex-1 bg-hairline" />
                  or type your city
                  <div className="h-px flex-1 bg-hairline" />
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
              <Button onClick={next} disabled={!state.city || state.city.length < 2} size="lg" className="mt-4 w-full shrink-0">
                Continue
              </Button>
            </>
          )}

          {step === 4 && (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <p className="text-[11px] font-bold uppercase tracking-[2px] text-red-fg">You&apos;re in</p>
                <h1 className="mt-3 text-[26px] font-extrabold leading-[1.15] tracking-[-0.8px] text-ink">
                  You&apos;re the first one in your network.
                </h1>
                <p className="mt-2 text-sm text-ink-muted">This is how hospitals and your circle will see you.</p>

                <m.div
                  initial={{ opacity: 0, y: 20, rotate: -3 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 160, damping: 16 }}
                  className="mt-5 rounded-card border border-white/10 bg-panel p-6 text-white shadow-[0_24px_48px_-16px_rgba(28,28,30,0.5)]"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[2px] text-white/50">Available donor</span>
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white/70">
                      Self-reported
                    </span>
                  </div>
                  <div className={cn("mt-5 font-extrabold leading-none tracking-tight", typeLabel ? "text-[56px] text-red-fg" : "text-[32px] text-white/70")}>
                    {typeLabel ?? "Type to add"}
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-white/60">
                    <MapPin className="size-3.5" /> {state.city}
                  </p>
                  <div className="my-5 h-px bg-white/10" />
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[11px] text-white/50">Last donation</p>
                      <p className="text-sm font-bold">
                        {donatedChoice === "never"
                          ? "Never"
                          : donatedChoice === "exact" && state.lastDonated
                            ? fmtDate(new Date(state.lastDonated))
                            : (DONATED_OPTIONS.find((o) => o.id === donatedChoice)?.label ?? "-")}
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
                  className="mt-4 flex items-start gap-3 rounded-card border-[0.5px] border-hairline bg-card p-4"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-light">
                    <BellRing className="size-[18px] text-red-fg" />
                  </span>
                  <p className="text-sm leading-relaxed text-ink-mid">
                    <span className="font-bold text-ink">What happens next:</span>{" "}
                    {typeLabel ? (
                      <>
                        when {typeLabel} blood is needed near {state.city}, you get an alert and answer Yes or No. Your
                        number is shared only if you say Yes.
                      </>
                    ) : (
                      <>
                        add your blood type once you know it, and you&apos;ll start getting alerts near {state.city}. Until
                        then you can still build your network.
                      </>
                    )}
                  </p>
                </m.div>

                <m.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-3 rounded-card bg-surface p-4"
                >
                  <div className="flex flex-wrap gap-2" aria-hidden>
                    <span className="flex size-9 items-center justify-center rounded-full bg-red text-[11px] font-bold text-white">
                      You
                    </span>
                    {Array.from({ length: POD_READY_THRESHOLD - 1 }, (_, i) => (
                      <span key={i} className="size-9 rounded-full border-[1.5px] border-dashed border-ink-faint/60" />
                    ))}
                  </div>
                  <p className="mt-3 text-sm font-bold text-ink">Next: add {POD_READY_THRESHOLD - 1} people you trust</p>
                  <p className="text-xs leading-relaxed text-ink-muted">
                    Your network is ready to answer an emergency once {POD_READY_THRESHOLD} people in it can donate.
                  </p>
                </m.div>
              </div>

              {signedIn ? (
                <>
                  {saveError && <p className="mt-3 text-center text-sm text-red-fg">Couldn&apos;t save that. Please try again.</p>}
                  <Button onClick={saveAnswers} loading={saving} size="lg" className="mt-4 w-full shrink-0 whitespace-nowrap">
                    Start my network
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="lg" className="mt-4 w-full shrink-0 whitespace-nowrap">
                    <Link href={signUpHref}>Start my network</Link>
                  </Button>
                  <p className="mt-3 text-center text-xs text-ink-muted">Free for donors. Next, a name and email to save your place.</p>
                </>
              )}
            </>
          )}
        </m.div>
      </AnimatePresence>
    </div>
  );
}
