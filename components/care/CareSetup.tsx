"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import type { BloodType, ConditionType } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { CARE_RULES, CONDITION_LABELS } from "@/lib/care-rules";

interface PodOption {
  id: string;
  name: string;
  members: number;
}

const STEPS = ["Patient", "Schedule", "Your Pod"] as const;
const label = "mb-1.5 block text-caption font-semibold text-ink-mid";

/** Three steps: who the patient is, when they next need blood, and which Pod to ask. */
export function CareSetup({ pods }: { pods: PodOption[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [conditionType, setConditionType] = useState<ConditionType>("SICKLE_CELL");
  const [bloodType, setBloodType] = useState<BloodType | "">("");
  const [hospitalName, setHospitalName] = useState("");
  const [shareCondition, setShareCondition] = useState(false);
  const [consent, setConsent] = useState(false);

  const [nextDate, setNextDate] = useState("");
  const [interval, setIntervalDays] = useState("28");
  const [donorsNeeded, setDonorsNeeded] = useState("2");

  const [podId, setPodId] = useState(pods[0]?.id ?? "");

  const today = new Date().toISOString().slice(0, 10);

  function next() {
    setError(null);
    if (step === 0) {
      if (displayName.trim().length < 2) return setError("Enter the patient's name or a nickname.");
      if (!bloodType) return setError("Choose their blood group.");
      if (!consent) return setError("Please confirm you have permission to share these details.");
    }
    if (step === 1) {
      if (!nextDate) return setError("Pick the next transfusion date.");
      if (nextDate < today) return setError("The date can not be in the past.");
    }
    setStep((s) => s + 1);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/care", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          conditionType,
          conditionVisibility: shareCondition ? "SHARED" : "PRIVATE",
          bloodType,
          hospitalName: hospitalName.trim() || undefined,
          transfusionIntervalDays: interval ? Number(interval) : null,
          nextTransfusionAt: new Date(`${nextDate}T09:00:00`).toISOString(),
          donorsNeeded: Number(donorsNeeded),
          podId: podId || null,
          consent,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!res.ok || !data.id) throw new Error(data.error ?? "Something went wrong. Please try again.");
      router.push(`/care/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 px-3.5 pb-8 pt-4 lg:max-w-xl lg:px-0 lg:pt-0">
      <ol className="flex items-center gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 flex-col gap-1.5" aria-current={i === step ? "step" : undefined}>
            <span className={`h-1 rounded-full ${i <= step ? "bg-red" : "bg-hairline"}`} />
            <span className={`text-label font-bold ${i === step ? "text-ink" : "text-ink-faint"}`}>
              {i + 1}. {s}
            </span>
          </li>
        ))}
      </ol>

      <section className="rounded-3xl border-[0.5px] border-hairline bg-card p-5 shadow-raised lg:rounded-2xl lg:p-6">
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="care-name" className={label}>
                Patient name or nickname
              </label>
              <Input id="care-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} autoComplete="off" />
              <p className="mt-1.5 text-caption text-ink-muted">Only you see this. Donors are never shown the name.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="care-blood" className={label}>
                  Blood group
                </label>
                <Select id="care-blood" value={bloodType} onChange={(e) => setBloodType(e.target.value as BloodType)}>
                  <option value="">Choose</option>
                  {(Object.keys(BLOOD_TYPE_LABELS) as BloodType[]).map((b) => (
                    <option key={b} value={b}>
                      {BLOOD_TYPE_LABELS[b]}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label htmlFor="care-condition" className={label}>
                  Condition
                </label>
                <Select id="care-condition" value={conditionType} onChange={(e) => setConditionType(e.target.value as ConditionType)}>
                  {(Object.keys(CONDITION_LABELS) as ConditionType[]).map((c) => (
                    <option key={c} value={c}>
                      {CONDITION_LABELS[c]}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <label htmlFor="care-hospital" className={label}>
                Usual hospital (optional)
              </label>
              <Input id="care-hospital" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} maxLength={120} autoComplete="off" />
            </div>

            <label className="flex items-start gap-3 rounded-2xl bg-surface p-3.5 text-body-sm text-ink">
              <input type="checkbox" checked={shareCondition} onChange={(e) => setShareCondition(e.target.checked)} className="mt-0.5 size-4 accent-red" />
              <span>
                <span className="font-bold">Let people in my Pod see the condition</span>
                <span className="mt-0.5 block text-caption text-ink-muted">Off by default. Donors who are asked to give see the blood group, date and hospital only.</span>
              </span>
            </label>

            <label className="flex items-start gap-3 text-caption leading-relaxed text-ink-mid">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-4 accent-red" />
              <span className="flex gap-1.5">
                <Lock className="mt-0.5 size-3.5 shrink-0 text-ink-faint" aria-hidden />I have permission from the patient, or their guardian, to store these health details on BloodPod.
              </span>
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="care-date" className={label}>
                Next transfusion date
              </label>
              <Input id="care-date" type="date" min={today} value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="care-interval" className={label}>
                  Repeats every (days)
                </label>
                <Input
                  id="care-interval"
                  type="number"
                  inputMode="numeric"
                  min={CARE_RULES.intervalMinDays}
                  max={CARE_RULES.intervalMaxDays}
                  value={interval}
                  onChange={(e) => setIntervalDays(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="care-needed" className={label}>
                  Donors needed
                </label>
                <Input id="care-needed" type="number" inputMode="numeric" min={1} max={CARE_RULES.maxDonorsNeeded} value={donorsNeeded} onChange={(e) => setDonorsNeeded(e.target.value)} />
              </div>
            </div>
            <p className="text-caption text-ink-muted">When you mark a transfusion done, we book the next one this many days later. Leave it empty to add dates yourself.</p>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            {pods.length ? (
              <div>
                <label htmlFor="care-pod" className={label}>
                  Which Pod should we ask?
                </label>
                <Select id="care-pod" value={podId} onChange={(e) => setPodId(e.target.value)}>
                  {pods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.members} {p.members === 1 ? "person" : "people"})
                    </option>
                  ))}
                  <option value="">Decide later</option>
                </Select>
              </div>
            ) : (
              <p className="rounded-2xl bg-surface p-3.5 text-body-sm text-ink-mid">You have no Pod of your own yet. You can add one later and link it from the Care Pod page.</p>
            )}
            <p className="text-caption leading-relaxed text-ink-muted">
              Only people in this Pod who can give on the day are shown. You choose who to ask, and each person is asked once per date. Their details reach you only after they say Yes.
            </p>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-red-light px-3.5 py-2.5 text-body-sm font-semibold text-red-fg" role="alert">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          {step > 0 && (
            <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={busy}>
              Back
            </Button>
          )}
          {step < 2 ? (
            <Button type="button" onClick={next} className="flex-1">
              Continue
            </Button>
          ) : (
            <Button type="button" onClick={submit} loading={busy} className="flex-1">
              Create Care Pod
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
