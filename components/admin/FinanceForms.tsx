"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/admin/finance-categories";
import { cn } from "@/lib/utils";

type Hospital = { id: string; name: string };

async function call(url: string, method: string, body?: unknown): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.ok) return null;
    const data = await res.json().catch(() => ({}));
    return data.error ?? "Something went wrong";
  } catch {
    return "Could not reach the server";
  }
}

const field =
  "w-full rounded-xl border border-hairline bg-card px-3.5 py-2.5 text-body-sm text-ink placeholder:text-ink-faint focus:border-red focus:outline-none focus:ring-3 focus:ring-red/8";
const label = "mb-1 block text-caption font-semibold text-ink-mid";
const today = () => new Date().toISOString().slice(0, 10);

function Disclosure({ title, children }: { title: string; children: (close: () => void) => React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full bg-red px-4 py-2.5 text-body-sm font-bold text-white transition-transform active:scale-95"
      >
        <Plus className={cn("size-4 transition-transform", open && "rotate-45")} /> {title}
      </button>
      {open && <div className="mt-3 rounded-2xl bg-surface p-4">{children(() => setOpen(false))}</div>}
    </div>
  );
}

export function AddEntryForm({ hospitals }: { hospitals: Hospital[] }) {
  const router = useRouter();
  const [type, setType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [status, setStatus] = useState<"PAID" | "PENDING">("PAID");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <Disclosure title="Record income or expense">
      {(close) => (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            setBusy(true);
            setError(null);
            const err = await call("/api/admin/finance/entries", "POST", {
              type,
              status,
              category: form.get("category"),
              amount: form.get("amount"),
              date: form.get("date"),
              description: form.get("description") || undefined,
              invoiceNo: form.get("invoiceNo") || undefined,
              hospitalId: form.get("hospitalId") || undefined,
            });
            setBusy(false);
            if (err) return setError(err);
            router.refresh();
            close();
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            {(["INCOME", "EXPENSE"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "rounded-full px-4 py-2 text-caption font-bold",
                  type === t ? "bg-panel text-white" : "bg-card text-ink-mid",
                )}
              >
                {t === "INCOME" ? "Money in" : "Money out"}
              </button>
            ))}
            <span className="mx-1 hidden w-px bg-hairline sm:block" />
            {(["PAID", "PENDING"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  "rounded-full px-4 py-2 text-caption font-bold",
                  status === s ? "bg-red text-white" : "bg-card text-ink-mid",
                )}
              >
                {s === "PAID" ? (type === "INCOME" ? "Received" : "Paid") : type === "INCOME" ? "Invoiced, not paid yet" : "Owed, not paid yet"}
              </button>
            ))}
          </div>

          <div>
            <label className={label} htmlFor="fe-category">Category</label>
            <select id="fe-category" name="category" className={field} required>
              {(type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="fe-amount">Amount (GH₵)</label>
            <input id="fe-amount" name="amount" inputMode="decimal" placeholder="1,500.00" className={field} required />
          </div>
          <div>
            <label className={label} htmlFor="fe-date">Date</label>
            <input id="fe-date" name="date" type="date" defaultValue={today()} className={field} required />
          </div>
          {type === "INCOME" ? (
            <div>
              <label className={label} htmlFor="fe-hospital">Hospital (optional)</label>
              <select id="fe-hospital" name="hospitalId" className={field} defaultValue="">
                <option value="">None</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div />
          )}
          {type === "INCOME" && (
            <div>
              <label className={label} htmlFor="fe-invoice">Invoice number (optional)</label>
              <input id="fe-invoice" name="invoiceNo" placeholder="INV-001" className={field} />
            </div>
          )}
          <div className={type === "INCOME" ? "" : "sm:col-span-2"}>
            <label className={label} htmlFor="fe-desc">Note (optional)</label>
            <input id="fe-desc" name="description" placeholder="What was it for?" className={field} />
          </div>

          {error && <p className="sm:col-span-2 text-caption font-semibold text-red-fg">{error}</p>}
          <div className="sm:col-span-2">
            <button disabled={busy} className="rounded-full bg-panel px-6 py-2.5 text-body-sm font-bold text-white disabled:opacity-50">
              {busy ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}
    </Disclosure>
  );
}

export function AddContractForm({ hospitals }: { hospitals: Hospital[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (hospitals.length === 0) {
    return <p className="text-caption text-ink-muted">Approve a hospital first, then you can add its contract here.</p>;
  }

  return (
    <Disclosure title="Add a contract">
      {(close) => (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            setBusy(true);
            setError(null);
            const err = await call("/api/admin/finance/contracts", "POST", {
              hospitalId: form.get("hospitalId"),
              monthly: form.get("monthly"),
              startsAt: form.get("startsAt"),
              notes: form.get("notes") || undefined,
            });
            setBusy(false);
            if (err) return setError(err);
            router.refresh();
            close();
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          <div>
            <label className={label} htmlFor="fc-hospital">Hospital</label>
            <select id="fc-hospital" name="hospitalId" className={field} required>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="fc-monthly">Monthly fee (GH₵)</label>
            <input id="fc-monthly" name="monthly" inputMode="decimal" placeholder="600" className={field} required />
          </div>
          <div>
            <label className={label} htmlFor="fc-start">Starts</label>
            <input id="fc-start" name="startsAt" type="date" defaultValue={today()} className={field} required />
          </div>
          <div>
            <label className={label} htmlFor="fc-notes">Note (optional)</label>
            <input id="fc-notes" name="notes" placeholder="Free 90-day pilot, then this" className={field} />
          </div>
          {error && <p className="sm:col-span-2 text-caption font-semibold text-red-fg">{error}</p>}
          <div className="sm:col-span-2">
            <button disabled={busy} className="rounded-full bg-panel px-6 py-2.5 text-body-sm font-bold text-white disabled:opacity-50">
              {busy ? "Saving..." : "Save contract"}
            </button>
          </div>
        </form>
      )}
    </Disclosure>
  );
}

export function OpeningBalanceForm({ current }: { current: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setBusy(true);
        setError(null);
        setSaved(false);
        const err = await call("/api/admin/finance/opening-balance", "PUT", { amount: form.get("amount") });
        setBusy(false);
        if (err) return setError(err);
        setSaved(true);
        router.refresh();
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <div className="min-w-[140px] flex-1">
        <label className={label} htmlFor="ob-amount">Cash you started with (GH₵)</label>
        <input id="ob-amount" name="amount" defaultValue={current} inputMode="decimal" placeholder="0" className={field} />
      </div>
      <button disabled={busy} className="rounded-full bg-panel px-5 py-2.5 text-body-sm font-bold text-white disabled:opacity-50">
        {busy ? "Saving..." : "Save"}
      </button>
      {error && <p className="w-full text-caption font-semibold text-red-fg">{error}</p>}
      {saved && <p className="w-full text-caption font-semibold text-[#1FA855]">Saved.</p>}
    </form>
  );
}

export function EntryActions({ id, status, type }: { id: string; status: "PAID" | "PENDING"; type: "INCOME" | "EXPENSE" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<string | null>) {
    setBusy(true);
    const err = await fn();
    setBusy(false);
    if (err) alert(err);
    else router.refresh();
  }

  return (
    <span className="flex items-center gap-3">
      {status === "PENDING" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => call(`/api/admin/finance/entries/${id}`, "PATCH", { status: "PAID" }))}
          className="text-caption font-bold text-[#1FA855] hover:underline disabled:opacity-50"
        >
          Mark {type === "INCOME" ? "received" : "paid"}
        </button>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          if (confirm("Delete this entry? This cannot be undone.")) run(() => call(`/api/admin/finance/entries/${id}`, "DELETE"));
        }}
        className="text-caption font-semibold text-ink-muted hover:text-red-fg disabled:opacity-50"
      >
        Delete
      </button>
    </span>
  );
}

export function ContractActions({ id, status }: { id: string; status: "ACTIVE" | "PAUSED" | "ENDED" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function set(next: "ACTIVE" | "PAUSED" | "ENDED") {
    if (next === "ENDED" && !confirm("End this contract? It stops counting towards monthly revenue.")) return;
    setBusy(true);
    const err = await call(`/api/admin/finance/contracts/${id}`, "PATCH", { status: next });
    setBusy(false);
    if (err) alert(err);
    else router.refresh();
  }

  return (
    <span className="flex items-center gap-3 text-caption font-semibold">
      {status === "ACTIVE" && (
        <button type="button" disabled={busy} onClick={() => set("PAUSED")} className="text-ink-mid hover:text-ink disabled:opacity-50">
          Pause
        </button>
      )}
      {status === "PAUSED" && (
        <button type="button" disabled={busy} onClick={() => set("ACTIVE")} className="text-[#1FA855] disabled:opacity-50">
          Resume
        </button>
      )}
      {status !== "ENDED" && (
        <button type="button" disabled={busy} onClick={() => set("ENDED")} className="text-ink-muted hover:text-red-fg disabled:opacity-50">
          End
        </button>
      )}
    </span>
  );
}
