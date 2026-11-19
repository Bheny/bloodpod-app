"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { SERVICE_TESTS, type ServiceTestId } from "@/lib/service-tests";
import { PLACES } from "@/lib/admin/places";
import { cn } from "@/lib/utils";

export interface LabFormValue {
  id: string;
  name: string;
  town: string;
  address: string;
  phone: string;
  latitude: string;
  longitude: string;
  /** Price in GH₵ as typed, or "" for none. */
  tests: Partial<Record<ServiceTestId, string>>;
}

const EMPTY: Omit<LabFormValue, "id"> = { name: "", town: "", address: "", phone: "", latitude: "", longitude: "", tests: {} };

const field =
  "w-full rounded-xl border border-[#E5E5EA] bg-white px-3.5 py-2.5 text-body-sm text-ink placeholder:text-ink-faint focus:border-red focus:outline-none";

/** Add a lab, or edit one when `lab` is given. */
export function LabForm({ lab, onDone }: { lab?: LabFormValue; onDone?: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(Boolean(lab));
  const [v, setV] = useState<Omit<LabFormValue, "id">>(lab ?? EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<typeof v>) => setV((cur) => ({ ...cur, ...patch }));
  const toggleTest = (id: ServiceTestId) =>
    setV((cur) => {
      const tests = { ...cur.tests };
      if (id in tests) delete tests[id];
      else tests[id] = "";
      return { ...cur, tests };
    });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(lab ? `/api/admin/labs/${lab.id}` : "/api/admin/labs", {
        method: lab ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: v.name,
          town: v.town,
          address: v.address,
          phone: v.phone,
          latitude: v.latitude,
          longitude: v.longitude,
          tests: (Object.entries(v.tests) as [ServiceTestId, string][]).map(([id, price]) => ({ id, price })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't save the lab");
      if (!lab) {
        setV(EMPTY);
        setOpen(false);
      }
      router.refresh();
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the lab");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full bg-red px-5 py-2.5 text-body-sm font-bold text-white transition-transform active:scale-95"
      >
        <Plus className="size-4" /> Add a lab
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={field} placeholder="Lab or clinic name" value={v.name} onChange={(e) => set({ name: e.target.value })} required />
        <div>
          <input
            className={field}
            list="lab-towns"
            placeholder="Town (e.g. Accra)"
            value={v.town}
            onChange={(e) => set({ town: e.target.value })}
            required
          />
          <datalist id="lab-towns">
            {PLACES.map((p) => (
              <option key={p.id} value={p.name} />
            ))}
          </datalist>
        </div>
        <input className={field} placeholder="Street address (optional)" value={v.address} onChange={(e) => set({ address: e.target.value })} />
        <input className={field} placeholder="Phone (optional)" value={v.phone} onChange={(e) => set({ phone: e.target.value })} inputMode="tel" />
        <input className={field} placeholder="Latitude (optional)" value={v.latitude} onChange={(e) => set({ latitude: e.target.value })} inputMode="decimal" />
        <input className={field} placeholder="Longitude (optional)" value={v.longitude} onChange={(e) => set({ longitude: e.target.value })} inputMode="decimal" />
      </div>
      <p className="text-caption text-ink-muted">
        Leave the coordinates empty to pin the lab at the town centre. For accurate distances, paste the lab&apos;s latitude and
        longitude from Google Maps (right-click the spot).
      </p>

      <fieldset>
        <legend className="text-caption font-bold text-ink">Tests offered (price in GH₵ is optional)</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {SERVICE_TESTS.map((t) => {
            const on = t.id in v.tests;
            return (
              <div key={t.id} className={cn("flex items-center gap-2 rounded-xl border px-3 py-2", on ? "border-red bg-red-light" : "border-[#E5E5EA]")}>
                <label className="flex flex-1 items-center gap-2 text-body-sm text-ink">
                  <input type="checkbox" checked={on} onChange={() => toggleTest(t.id)} className="accent-red" />
                  {t.label}
                </label>
                {on && (
                  <input
                    className="w-20 rounded-lg border border-[#E5E5EA] bg-white px-2 py-1 text-caption"
                    placeholder="Price"
                    value={v.tests[t.id] ?? ""}
                    onChange={(e) => set({ tests: { ...v.tests, [t.id]: e.target.value } })}
                    inputMode="decimal"
                    aria-label={`${t.label} price`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </fieldset>

      {error && <p className="text-caption text-red">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-red px-5 py-2.5 text-body-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? "Saving..." : lab ? "Save changes" : "Add lab"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setV(lab ?? EMPTY);
            onDone?.();
          }}
          className="rounded-full bg-surface px-5 py-2.5 text-body-sm font-bold text-ink-mid"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
