"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const TYPES = [
  { id: "O_POS", label: "O+" },
  { id: "O_NEG", label: "O−" },
  { id: "A_POS", label: "A+" },
  { id: "A_NEG", label: "A−" },
  { id: "B_POS", label: "B+" },
  { id: "B_NEG", label: "B−" },
  { id: "AB_POS", label: "AB+" },
  { id: "AB_NEG", label: "AB−" },
];

const URGENCY = [
  { id: "CRITICAL", label: "Critical", hint: "Right now. Alerts widen after 5 minutes." },
  { id: "URGENT", label: "Urgent", hint: "Within hours. Alerts widen after 15 minutes." },
  { id: "STANDARD", label: "Needed", hint: "Within a day or two. Alerts widen after an hour." },
] as const;

/** Raise a blood request. Says plainly who will be told before anything is sent. */
export function RequestForm({ defaultType, podReach, canTest }: { defaultType: string | null; podReach: Record<string, number>; canTest: boolean }) {
  const router = useRouter();
  const [bloodType, setBloodType] = useState(defaultType ?? "");
  const [urgency, setUrgency] = useState<string>("URGENT");
  const [facility, setFacility] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [test, setTest] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reach = bloodType ? (podReach[bloodType] ?? 0) : null;
  const typeLabel = TYPES.find((t) => t.id === bloodType)?.label;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bloodType, urgency, facility, location, message, test }),
      });
      const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      // Already has one open: go and follow that one.
      if (data.id && (res.ok || res.status === 409)) {
        router.push(`/dashboard/request/${data.id}`);
        return;
      }
      setError(data.error ?? "Could not send the alert. Try again.");
    } catch {
      setError("No connection. Check your network and try again.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <fieldset>
        <legend className="text-body-sm font-bold text-ink">Blood type needed</legend>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setBloodType(t.id)}
              aria-pressed={bloodType === t.id}
              className={cn(
                "min-h-12 rounded-2xl border text-title font-extrabold transition-colors",
                bloodType === t.id ? "border-red bg-red text-white" : "border-hairline bg-card text-ink hover:border-red-mid",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-body-sm font-bold text-ink">How urgent is it?</legend>
        <div className="mt-2 flex flex-col gap-2">
          {URGENCY.map((u) => (
            <label
              key={u.id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors",
                urgency === u.id ? "border-red bg-red-light/50" : "border-hairline bg-card",
              )}
            >
              <input type="radio" name="urgency" value={u.id} checked={urgency === u.id} onChange={() => setUrgency(u.id)} className="mt-1 accent-[#DD0000]" />
              <span>
                <span className="block text-body-sm font-bold text-ink">{u.label}</span>
                <span className="block text-caption text-ink-muted">{u.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="facility" className="text-body-sm font-bold text-ink">
          Hospital or clinic
        </label>
        <Input id="facility" className="mt-2" value={facility} onChange={(e) => setFacility(e.target.value)} placeholder="Korle Bu Teaching Hospital" maxLength={120} required />
      </div>
      <div>
        <label htmlFor="location" className="text-body-sm font-bold text-ink">
          Ward or area <span className="font-medium text-ink-muted">(optional)</span>
        </label>
        <Input id="location" className="mt-2" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Emergency ward, Accra" maxLength={120} />
      </div>
      <div>
        <label htmlFor="message" className="text-body-sm font-bold text-ink">
          A note for donors <span className="font-medium text-ink-muted">(optional)</span>
        </label>
        <Textarea id="message" className="mt-2" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ask for the blood bank on the ground floor." maxLength={280} />
        <p className="mt-1.5 text-caption text-ink-muted">Blood is never bought, sold or paid for on BloodPod. Do not offer money or rewards.</p>
      </div>

      <div className="rounded-2xl bg-surface p-4 text-caption leading-relaxed text-ink-mid" aria-live="polite">
        {reach === null ? (
          "Choose a blood type to see who will be told."
        ) : reach > 0 ? (
          <>
            <strong className="text-ink">
              {reach} {reach === 1 ? "person" : "people"} in your Pod
            </strong>{" "}
            who can give {typeLabel} blood will be alerted now. If nobody says yes in time, we widen to matching donors nearby who chose to be listed.
          </>
        ) : (
          <>
            <strong className="text-ink">Nobody in your Pod can give this blood type right now.</strong> We will go straight to matching donors nearby who chose to be listed.
          </>
        )}
        <span className="mt-2 block">Anyone who says yes shares their name and number with you, and you share yours with them. Your number is shown only to people who say yes.</span>
      </div>

      {canTest && (
        <label className="flex items-start gap-2.5 text-caption text-ink-mid">
          <input type="checkbox" checked={test} onChange={(e) => setTest(e.target.checked)} className="mt-0.5 accent-[#DD0000]" />
          <span>
            <strong className="text-ink">Send as a test.</strong> Marked TEST. Reaches only you and your Pod, and never widens to strangers.
          </span>
        </label>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-red-light px-4 py-3 text-body-sm font-semibold text-red-fg">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" loading={busy} disabled={!bloodType || facility.trim().length < 2} className="w-full">
        <BellRing className="size-5" aria-hidden="true" /> {test ? "Send test alert" : "Send alert"}
      </Button>
    </form>
  );
}
