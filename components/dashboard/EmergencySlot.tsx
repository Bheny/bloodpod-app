"use client";

import Link from "next/link";
import useSWR from "swr";
import { jsonFetcher } from "@/lib/fetcher";
import { m } from "framer-motion";
import { Droplet, ShieldCheck } from "lucide-react";
import type { EmergencyView } from "@/lib/emergencies";
import { formatRelativeTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const POLL_MS = 30_000;

const URGENCY_LABEL = { CRITICAL: "Critical", URGENT: "Urgent", STANDARD: "Needed" } as const;

export function EmergencySlot({
  initial,
  bloodType,
}: {
  initial: EmergencyView[];
  bloodType: string | null;
}) {
  // New alerts appear without a reload. SWR polls while the tab is visible, refreshes
  // when the person returns to it or comes back online, and keeps the last good list
  // on a network blip.
  const { data } = useSWR<{ emergencies: EmergencyView[] }>("/api/emergencies", jsonFetcher, {
    fallbackData: { emergencies: initial },
    refreshInterval: POLL_MS,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });
  const emergencies = data?.emergencies ?? initial;

  const top = emergencies[0];

  if (!top) {
    return (
      <section
        aria-live="polite"
        className="flex items-center gap-4 rounded-3xl border-[0.5px] border-hairline bg-card lg:rounded-2xl p-4 shadow-raised lg:p-6"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-success-soft lg:size-12">
          <ShieldCheck className="size-5 text-[#1FA855] lg:size-6" />
        </span>
        <div>
          <p className="text-body-sm font-bold text-ink lg:text-title">No active emergencies near you</p>
          <p className="mt-0.5 text-caption text-ink-muted lg:text-body-sm">
            {bloodType
              ? `If ${bloodType} blood is needed, it shows up here and on your phone.`
              : "Add your blood type so we can tell you when it is needed."}
          </p>
        </div>
      </section>
    );
  }

  const critical = top.urgency === "CRITICAL";

  return (
    <section aria-live="assertive" className="overflow-hidden rounded-2xl bg-panel p-4 text-white shadow-raised lg:p-6">
      <div className="flex items-start gap-3 lg:gap-4">
        <m.span
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-red/25 lg:size-14"
        >
          <Droplet className="size-5 text-red-fg lg:size-7" />
        </m.span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-label font-bold uppercase tracking-wide",
                critical ? "bg-red text-white" : "bg-white/15 text-white",
              )}
            >
              {URGENCY_LABEL[top.urgency]}
            </span>
            <span className="text-label text-white/70" suppressHydrationWarning>
              {formatRelativeTime(top.createdAt)}
            </span>
          </div>

          <p className="mt-2 text-title font-extrabold leading-tight tracking-[-0.4px] lg:text-title-lg">
            {top.isTest ? "Test: " : ""}{top.facility} needs {top.bloodType} blood
          </p>
          <p className="mt-1 text-caption text-white/70 lg:text-body-sm">
            {[top.location, top.requesterName ? `Requested by ${top.requesterName}` : null].filter(Boolean).join(" · ")}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href={`/dashboard/alert/${top.id}`}
              className="rounded-full bg-red px-5 py-2.5 text-body-sm font-bold text-white transition-transform active:scale-95"
            >
              {top.myAnswer === "COMING" ? "You are coming" : "Respond"}
            </Link>
            {emergencies.length > 1 && (
              <span className="text-caption text-white/70">+{emergencies.length - 1} more open</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
