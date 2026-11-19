"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Inbox, Phone } from "lucide-react";
import type { BookingStatus } from "@prisma/client";
import { BOOKING_STATUS, dayText } from "@/lib/booking-status";
import { TONE } from "@/components/services/MyBookings";
import { cn } from "@/lib/utils";

export interface InboxBooking {
  id: string;
  status: BookingStatus;
  testName: string;
  personName: string | null;
  personPhone: string | null;
  preferredDate: string | null;
  scheduledFor: string | null;
  note: string | null;
  labNote: string | null;
  createdAt: string;
}

type Tab = "new" | "upcoming" | "history";

const TABS: { id: Tab; label: string; match: BookingStatus[] }[] = [
  { id: "new", label: "New", match: ["REQUESTED"] },
  { id: "upcoming", label: "Upcoming", match: ["CONFIRMED", "RESCHEDULED"] },
  { id: "history", label: "History", match: ["COMPLETED", "DECLINED", "CANCELLED"] },
];

const inputCls =
  "rounded-xl border border-[#E5E5EA] bg-white px-3 py-2 text-body-sm text-ink focus:border-red focus:outline-none";

export function LabInbox({ bookings }: { bookings: InboxBooking[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("new");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Which card has its "suggest another day" or "decline" form open.
  const [form, setForm] = useState<{ id: string; kind: "propose" | "decline" } | null>(null);
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  async function act(id: string, action: "accept" | "propose" | "decline" | "complete" | "cancel") {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/lab/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, scheduledFor: action === "propose" ? date : undefined, note: note || undefined }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Something went wrong");
      setForm(null);
      setDate("");
      setNote("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  const counts = Object.fromEntries(TABS.map((t) => [t.id, bookings.filter((b) => t.match.includes(b.status)).length]));
  const shown = bookings.filter((b) => TABS.find((t) => t.id === tab)!.match.includes(b.status));
  const btn = "rounded-full px-4 py-2 text-caption font-bold disabled:opacity-50";

  return (
    <div className="mt-5">
      <div className="flex gap-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-full px-4 py-2 text-body-sm font-bold transition-colors",
              tab === t.id ? "bg-ink text-white" : "bg-white text-ink-mid",
            )}
          >
            {t.label}
            {counts[t.id] > 0 && <span className="ml-1.5 opacity-70">{counts[t.id]}</span>}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-caption text-red">{error}</p>}

      {shown.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-white px-6 py-12 text-center shadow-raised">
          <Inbox className="mx-auto size-9 text-ink-faint" />
          <p className="mt-3 text-body-sm font-bold text-ink">Nothing here</p>
          <p className="mt-1 text-caption text-ink-muted">
            {tab === "new" ? "New requests appear here and you'll get a notification." : "Nothing to show yet."}
          </p>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {shown.map((b) => {
            const st = BOOKING_STATUS[b.status];
            const open = form?.id === b.id ? form.kind : null;
            const working = busy === b.id;
            return (
              <li key={b.id} className="rounded-2xl border-[0.5px] border-hairline bg-white p-4 shadow-raised lg:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-body-sm font-bold text-ink lg:text-title">{b.personName ?? "Unnamed person"}</p>
                    {b.personPhone ? (
                      <a href={`tel:${b.personPhone.replace(/[^\d+]/g, "")}`} className="mt-0.5 flex items-center gap-1.5 text-caption font-bold text-red">
                        <Phone className="size-3.5" /> {b.personPhone}
                      </a>
                    ) : (
                      <p className="mt-0.5 text-caption text-ink-muted">No phone number on file</p>
                    )}
                  </div>
                  <span className={cn("rounded-full px-2.5 py-1 text-label font-bold", TONE[st.tone])}>{st.label}</span>
                </div>

                <p className="mt-3 text-body-sm text-ink">{b.testName}</p>
                <p className="mt-0.5 text-caption text-ink-muted">
                  {b.status === "CONFIRMED" || b.status === "COMPLETED"
                    ? `Day: ${dayText(b.scheduledFor)}`
                    : b.status === "RESCHEDULED"
                      ? `Asked for ${dayText(b.preferredDate)} · you suggested ${dayText(b.scheduledFor)}`
                      : `Preferred day: ${dayText(b.preferredDate)}`}
                </p>
                {b.note && <p className="mt-2 rounded-lg bg-surface px-3 py-2 text-caption text-ink-mid">&ldquo;{b.note}&rdquo;</p>}

                <div className="mt-3 flex flex-wrap gap-2">
                  {b.status === "REQUESTED" && (
                    <>
                      <button type="button" disabled={working} onClick={() => act(b.id, "accept")} className={cn(btn, "bg-[#1FA855] text-white")}>
                        Accept {dayText(b.preferredDate)}
                      </button>
                      <button type="button" disabled={working} onClick={() => setForm({ id: b.id, kind: "propose" })} className={cn(btn, "bg-surface text-ink-mid")}>
                        Suggest another day
                      </button>
                      <button type="button" disabled={working} onClick={() => setForm({ id: b.id, kind: "decline" })} className={cn(btn, "bg-surface text-ink-mid")}>
                        Decline
                      </button>
                    </>
                  )}
                  {b.status === "CONFIRMED" && (
                    <>
                      <button type="button" disabled={working} onClick={() => act(b.id, "complete")} className={cn(btn, "bg-[#1FA855] text-white")}>
                        Mark as done
                      </button>
                      <button type="button" disabled={working} onClick={() => setForm({ id: b.id, kind: "decline" })} className={cn(btn, "bg-surface text-ink-mid")}>
                        Cancel visit
                      </button>
                    </>
                  )}
                  {b.status === "RESCHEDULED" && (
                    <p className="text-caption text-ink-muted">Waiting for them to accept the new day.</p>
                  )}
                </div>

                {open && (
                  <div className="mt-3 flex flex-col gap-2 rounded-xl bg-surface p-3">
                    {open === "propose" && (
                      <input
                        type="date"
                        min={new Date().toISOString().slice(0, 10)}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={inputCls}
                        aria-label="New day"
                      />
                    )}
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={300}
                      placeholder={open === "propose" ? "Message (optional), e.g. we're closed that day" : "Reason (optional)"}
                      className={inputCls}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={working || (open === "propose" && !date)}
                        onClick={() => act(b.id, open === "propose" ? "propose" : b.status === "CONFIRMED" ? "cancel" : "decline")}
                        className={cn(btn, "bg-red text-white")}
                      >
                        {open === "propose" ? "Send new day" : b.status === "CONFIRMED" ? "Cancel visit" : "Decline request"}
                      </button>
                      <button type="button" onClick={() => setForm(null)} className={cn(btn, "bg-white text-ink-mid")}>
                        Back
                      </button>
                    </div>
                  </div>
                )}

                {b.labNote && b.status !== "REQUESTED" && <p className="mt-2 text-caption text-ink-muted">Your note: {b.labNote}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
