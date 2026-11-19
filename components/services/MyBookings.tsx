"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FlaskConical, Phone } from "lucide-react";
import type { BookingStatus } from "@prisma/client";
import { BOOKING_STATUS, dayText } from "@/lib/booking-status";
import { cn } from "@/lib/utils";

export interface MyBooking {
  id: string;
  status: BookingStatus;
  testName: string;
  labName: string;
  labTown: string;
  labPhone: string | null;
  preferredDate: string | null;
  scheduledFor: string | null;
  labNote: string | null;
}

export const TONE = {
  amber: "bg-warn-soft text-warn-strong",
  green: "bg-success-soft text-success-strong",
  gray: "bg-surface text-ink-mid",
  red: "bg-red-light text-red-fg",
  blue: "bg-info-soft text-info-strong",
} as const;

export function MyBookings({ bookings }: { bookings: MyBooking[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(id: string, action: "cancel" | "accept") {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Something went wrong");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  if (bookings.length === 0) {
    return (
      <div className="mx-3.5 mt-4 rounded-2xl bg-card px-6 py-10 text-center shadow-raised lg:mx-0 lg:max-w-2xl">
        <FlaskConical className="mx-auto size-9 text-ink-faint" />
        <p className="mt-3 text-body-sm font-bold text-ink">No requests yet</p>
        <p className="mt-1 text-caption text-ink-muted">Find a lab on the Services page and request a test.</p>
        <Link href="/services" className="mt-4 inline-flex rounded-full bg-red px-6 py-3 text-body-sm font-bold text-white">
          Find a lab
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-3.5 pb-8 pt-4 lg:max-w-2xl lg:px-0 lg:pt-0">
      {error && <p className="text-caption text-red-fg">{error}</p>}
      {bookings.map((b) => {
        const st = BOOKING_STATUS[b.status];
        const open = b.status === "REQUESTED" || b.status === "RESCHEDULED" || b.status === "CONFIRMED";
        return (
          <article key={b.id} className="rounded-2xl border-[0.5px] border-hairline bg-card p-4 shadow-raised lg:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-body-sm font-bold text-ink lg:text-title">{b.labName}</p>
                <p className="text-caption text-ink-muted">{b.labTown}</p>
              </div>
              <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-label font-bold", TONE[st.tone])}>{st.label}</span>
            </div>

            <p className="mt-2 text-caption text-ink">{b.testName}</p>
            <p className="mt-0.5 text-caption text-ink-muted">
              {b.status === "CONFIRMED" || b.status === "COMPLETED"
                ? `Day: ${dayText(b.scheduledFor)}`
                : b.status === "RESCHEDULED"
                  ? `You asked for ${dayText(b.preferredDate)}. The lab suggests ${dayText(b.scheduledFor)}.`
                  : `Preferred day: ${dayText(b.preferredDate)}`}
            </p>
            {b.labNote && <p className="mt-1.5 rounded-lg bg-surface px-3 py-2 text-caption text-ink-mid">Lab: {b.labNote}</p>}

            {open && (
              <div className="mt-3 flex flex-wrap gap-2">
                {b.status === "RESCHEDULED" && (
                  <button
                    type="button"
                    disabled={busy === b.id}
                    onClick={() => act(b.id, "accept")}
                    className="rounded-full bg-red px-4 py-2 text-caption font-bold text-white disabled:opacity-50"
                  >
                    Accept new day
                  </button>
                )}
                {b.labPhone && (
                  <a
                    href={`tel:${b.labPhone.replace(/[^\d+]/g, "")}`}
                    className="flex items-center gap-1.5 rounded-full bg-surface px-4 py-2 text-caption font-bold text-ink-mid"
                  >
                    <Phone className="size-3.5" /> Call
                  </a>
                )}
                <button
                  type="button"
                  disabled={busy === b.id}
                  onClick={() => act(b.id, "cancel")}
                  className="rounded-full bg-surface px-4 py-2 text-caption font-bold text-ink-mid disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
