"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, MapPin, Pencil, Phone, Trash2 } from "lucide-react";
import { Badge } from "@/components/admin/ui";
import { LabForm, type LabFormValue } from "@/components/admin/LabForm";
import { ghs } from "@/lib/admin/format";
import { testLabel, type ServiceTestId } from "@/lib/service-tests";

export interface LabRowData {
  form: LabFormValue;
  active: boolean;
  tests: { id: ServiceTestId; pricePesewas: number | null }[];
  staff: { id: string; email: string; name: string | null }[];
}

export function LabRow({ lab }: { lab: LabRowData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [staffError, setStaffError] = useState<string | null>(null);
  const { form } = lab;

  async function staffCall(method: "POST" | "DELETE", body: unknown) {
    setBusy(true);
    setStaffError(null);
    try {
      const res = await fetch(`/api/admin/labs/${form.id}/staff`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Something went wrong");
      setEmail("");
      router.refresh();
    } catch (e) {
      setStaffError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function call(method: "PATCH" | "DELETE", body?: unknown) {
    setBusy(true);
    try {
      await fetch(`/api/admin/labs/${form.id}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (editing) return <LabForm lab={form} onDone={() => setEditing(false)} />;

  return (
    <div>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-body-sm font-bold text-ink">{form.name}</h3>
          <Badge tone={lab.active ? "green" : "gray"}>{lab.active ? "Listed" : "Hidden"}</Badge>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-caption text-ink-muted">
          <MapPin className="size-3.5" /> {[form.address, form.town].filter(Boolean).join(", ")}
        </p>
        {form.phone && (
          <p className="mt-0.5 flex items-center gap-1.5 text-caption text-ink-muted">
            <Phone className="size-3.5" /> {form.phone}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {lab.tests.map((t) => (
            <Badge key={t.id}>
              {testLabel(t.id)}
              {t.pricePesewas !== null && ` · ${ghs(t.pricePesewas)}`}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={busy}
          onClick={() => setEditing(true)}
          aria-label="Edit lab"
          className="flex size-9 items-center justify-center rounded-full bg-surface text-ink-mid hover:bg-hairline"
        >
          <Pencil className="size-4" />
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => call("PATCH", { active: !lab.active })}
          aria-label={lab.active ? "Hide lab" : "Show lab"}
          className="flex size-9 items-center justify-center rounded-full bg-surface text-ink-mid hover:bg-hairline"
        >
          {lab.active ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (window.confirm(`Remove ${form.name}?`)) call("DELETE");
          }}
          aria-label="Remove lab"
          className="flex size-9 items-center justify-center rounded-full bg-surface text-ink-mid hover:bg-red-light hover:text-red"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>

    <div className="mt-4 border-t-[0.5px] border-hairline pt-3">
      <p className="text-caption font-bold text-ink">Lab staff (can use /lab)</p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {lab.staff.length === 0 && <li className="text-caption text-ink-muted">Nobody yet. Add an email below.</li>}
        {lab.staff.map((s) => (
          <li key={s.id} className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-caption text-ink-mid">
            {s.name ? `${s.name} · ${s.email}` : s.email}
            <button type="button" disabled={busy} onClick={() => staffCall("DELETE", { userId: s.id })} aria-label={`Remove ${s.email}`} className="font-bold text-ink-faint hover:text-red">
              ×
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-2 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          staffCall("POST", { email });
        }}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Staff email (they must have signed up)"
          className="min-w-0 flex-1 rounded-xl border border-[#E5E5EA] bg-white px-3 py-2 text-caption text-ink focus:border-red focus:outline-none"
        />
        <button type="submit" disabled={busy} className="rounded-full bg-ink px-4 py-2 text-caption font-bold text-white disabled:opacity-50">
          Add
        </button>
      </form>
      {staffError && <p className="mt-1.5 text-caption text-red">{staffError}</p>}
    </div>
    </div>
  );
}
