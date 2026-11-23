"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, HandHeart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import type { BloodType } from "@prisma/client";

async function post(url: string, body?: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return res.ok ? { ok: true } : { ok: false, error: data.error ?? "Something went wrong. Please try again." };
  } catch {
    return { ok: false, error: "No connection. Check your internet and try again." };
  }
}

const Err = ({ text }: { text: string | null }) =>
  text ? (
    <p className="mt-3 rounded-xl bg-red-light px-3.5 py-2.5 text-body-sm font-semibold text-red-fg" role="alert">
      {text}
    </p>
  ) : null;

export interface DonorOption {
  userId: string;
  name: string | null;
  bloodType: BloodType | null;
  eligible: boolean;
  eligibleInDays: number;
  asked: boolean;
}

/** Pick eligible Pod members for one date and ask them. Each person is asked once per date. */
export function AskDonors({ profileId, dateId, donors, disabled }: { profileId: string; dateId: string; donors: DonorOption[]; disabled: boolean }) {
  const router = useRouter();
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  async function send() {
    setBusy(true);
    setError(null);
    const r = await post(`/api/care/${profileId}/dates/${dateId}/ask`, { donorIds: picked });
    setBusy(false);
    if (!r.ok) return setError(r.error ?? null);
    setPicked([]);
    router.refresh();
  }

  if (!donors.length) {
    return <p className="text-body-sm text-ink-muted">No one in your Pod has a blood group set yet. Invite people from your Pod page.</p>;
  }

  return (
    <div>
      <ul className="flex flex-col divide-y-[0.5px] divide-hairline">
        {donors.map((d) => {
          const canAsk = d.eligible && !d.asked && !disabled;
          return (
            <li key={d.userId}>
              <label className={`flex min-h-12 items-center gap-3 py-2 ${canAsk ? "cursor-pointer" : "opacity-60"}`}>
                <input
                  type="checkbox"
                  disabled={!canAsk}
                  checked={picked.includes(d.userId)}
                  onChange={() => toggle(d.userId)}
                  className="size-4 accent-red"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body-sm font-bold text-ink">{d.name ?? "Pod member"}</span>
                  <span className="block text-caption text-ink-muted">
                    {d.bloodType ? BLOOD_TYPE_LABELS[d.bloodType] : "Blood group unknown"}
                    {" · "}
                    {d.asked ? "Already asked" : d.eligible ? "Can give on the day" : `Can give ${d.eligibleInDays} days after`}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <Err text={error} />
      <Button type="button" onClick={send} loading={busy} disabled={!picked.length || disabled} className="mt-3 w-full">
        <HandHeart className="size-4" aria-hidden /> Ask {picked.length || ""} {picked.length === 1 ? "person" : "people"}
      </Button>
    </div>
  );
}

export function MarkDone({ profileId, dateId, disabled }: { profileId: string; dateId: string; disabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    const r = await post(`/api/care/${profileId}/dates/${dateId}/complete`);
    setBusy(false);
    if (!r.ok) return setError(r.error ?? null);
    router.refresh();
  }

  return (
    <div>
      <Button type="button" variant="secondary" size="sm" onClick={go} loading={busy} disabled={disabled}>
        <Check className="size-4" aria-hidden /> Mark as done
      </Button>
      <Err text={error} />
    </div>
  );
}

export function AddDate({ profileId, disabled }: { profileId: string; disabled: boolean }) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return setError("Pick a date.");
    setBusy(true);
    setError(null);
    const r = await post(`/api/care/${profileId}/dates`, { scheduledFor: new Date(`${date}T09:00:00`).toISOString() });
    setBusy(false);
    if (!r.ok) return setError(r.error ?? null);
    setDate("");
    router.refresh();
  }

  return (
    <form onSubmit={add}>
      <label htmlFor="add-date" className="mb-1.5 block text-caption font-semibold text-ink-mid">
        Add another date
      </label>
      <div className="flex gap-2">
        <Input id="add-date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} disabled={disabled} />
        <Button type="submit" size="sm" loading={busy} disabled={disabled}>
          Add
        </Button>
      </div>
      <Err text={error} />
    </form>
  );
}

/** A donor's Yes or No. Free for everyone, always. */
export function AskAnswer({ entryId, status }: { entryId: string; status: "REQUESTED" | "YES" }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"yes" | "no" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function answer(a: "yes" | "no") {
    setBusy(a);
    setError(null);
    const r = await post(`/api/care/rota/${entryId}`, { answer: a });
    setBusy(null);
    if (!r.ok) return setError(r.error ?? null);
    router.refresh();
  }

  return (
    <div className="mt-3">
      {status === "YES" ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-body-sm font-bold text-success-strong">You said Yes. Thank you.</p>
          <button type="button" onClick={() => answer("no")} disabled={busy !== null} className="min-h-11 px-2 text-caption font-semibold text-ink-muted underline underline-offset-2">
            I can not make it
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" onClick={() => answer("yes")} loading={busy === "yes"} disabled={busy !== null}>
            Yes, I can
          </Button>
          <Button type="button" variant="ghost" onClick={() => answer("no")} loading={busy === "no"} disabled={busy !== null}>
            Not this time
          </Button>
        </div>
      )}
      <Err text={error} />
    </div>
  );
}
