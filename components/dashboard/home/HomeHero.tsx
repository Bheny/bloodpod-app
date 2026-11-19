"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { AnimatePresence, m } from "framer-motion";
import { jsonFetcher } from "@/lib/fetcher";
import type { EmergencyView } from "@/lib/emergencies";
import type { PodListItem } from "@/lib/pod-data";
import { POD_READY_THRESHOLD } from "@/components/dashboard/PodReadyCard";
import { CreatePodCard } from "@/components/pod/CreatePodCard";
import { formatRelativeTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const POLL_MS = 30_000;

/** A progress ring with the number in the middle. */
function Ring({ value, of }: { value: number; of: number }) {
  const R = 26;
  const C = 2 * Math.PI * R;
  const pct = of > 0 ? Math.min(value / of, 1) : 0;
  return (
    <div className="relative size-[76px] shrink-0">
      <svg viewBox="0 0 64 64" className="size-full -rotate-90" aria-hidden>
        <circle cx="32" cy="32" r={R} fill="none" strokeWidth="7" className="stroke-red/15" />
        <m.circle
          cx="32"
          cy="32"
          r={R}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          className="stroke-red"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C * (1 - pct) }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[22px] font-extrabold leading-none tracking-[-0.8px] text-ink">{value}</span>
        <span className="mt-0.5 text-label font-semibold text-ink-muted">of {of}</span>
      </div>
    </div>
  );
}

function PodSlide({ pod, quiet }: { pod: PodListItem; quiet: boolean }) {
  const ready = pod.readyCount >= POD_READY_THRESHOLD;
  const owner = pod.role === "owner";
  const need = Math.max(POD_READY_THRESHOLD - pod.readyCount, 0);

  const status = ready ? (quiet ? "All quiet" : "Ready to answer") : `${need} more ${need === 1 ? "person" : "people"} to be ready`;
  const sub = `${pod.readyCount} of ${pod.memberCount} can donate now`;

  const cta = owner
    ? ready
      ? { href: "/dashboard/request", label: "Alert my Pod" }
      : { href: `/pod/${pod.id}/invite`, label: "Invite people" }
    : { href: `/pod/${pod.id}`, label: "Open Pod" };

  return (
    <div className="rounded-3xl bg-red-light p-4">
      <div className="flex items-center gap-4">
        <Ring value={pod.readyCount} of={ready ? pod.memberCount : POD_READY_THRESHOLD} />
        <div className="min-w-0 flex-1">
          <p className="text-label font-bold uppercase tracking-wide text-red-fg">{owner ? "Your Pod" : "A Pod you joined"}</p>
          <p className="truncate text-[22px] font-extrabold leading-tight tracking-[-0.6px] text-ink">{pod.name}</p>
          <p className="truncate text-caption font-semibold text-ink-mid">{status}</p>
          <p className="truncate text-label text-ink-muted">{sub}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Link
          href={cta.href}
          className="flex-1 rounded-full bg-red py-3 text-center text-body-sm font-bold text-white transition-transform active:scale-[0.98]"
        >
          {cta.label}
        </Link>
        {owner && ready && (
          <Link
            href={`/pod/${pod.id}`}
            className="rounded-full bg-card px-5 py-3 text-center text-body-sm font-bold text-ink transition-transform active:scale-[0.98]"
          >
            Manage
          </Link>
        )}
      </div>
    </div>
  );
}

function EmptySlide() {
  return (
    <div className="rounded-3xl bg-red-light p-4">
      <div className="flex items-center gap-4">
        <Ring value={0} of={POD_READY_THRESHOLD} />
        <div className="min-w-0 flex-1">
          <p className="text-label font-bold uppercase tracking-wide text-red-fg">Step 1</p>
          <p className="text-[22px] font-extrabold leading-tight tracking-[-0.6px] text-ink">Build your Pod</p>
          <p className="text-caption font-semibold text-ink-mid">Invite {POD_READY_THRESHOLD} people you trust.</p>
        </div>
      </div>
      <Link
        href="/pod/invite"
        className="mt-4 block rounded-full bg-red py-3 text-center text-body-sm font-bold text-white transition-transform active:scale-[0.98]"
      >
        Invite people
      </Link>
    </div>
  );
}

/**
 * The first thing on the phone home screen, and the only big thing: an emergency when one is open
 * for your blood type, then your Pods as swipeable cards.
 */
export function HomeHero({
  initialEmergencies,
  pods,
  allowance,
  firstName,
}: {
  initialEmergencies: EmergencyView[];
  pods: PodListItem[];
  allowance: { owned: number; limit: number };
  firstName: string | null;
}) {
  // Same key as the desktop emergency card, so SWR shares one request between them.
  const { data } = useSWR<{ emergencies: EmergencyView[] }>("/api/emergencies", jsonFetcher, {
    fallbackData: { emergencies: initialEmergencies },
    refreshInterval: POLL_MS,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });
  const emergencies = data?.emergencies ?? initialEmergencies;
  const [dismissed, setDismissed] = useState<string[]>([]);
  const open = emergencies.filter((e) => !dismissed.includes(e.id));
  const top = open[0];

  const slides = pods.length + 1; // the last one starts another Pod
  const scroller = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  function onScroll() {
    const el = scroller.current;
    const first = el?.firstElementChild as HTMLElement | null | undefined;
    if (!el || !first) return;
    setActive(Math.min(slides - 1, Math.max(0, Math.round(el.scrollLeft / (first.offsetWidth + 12)))));
  }

  function goTo(i: number) {
    (scroller.current?.children[i] as HTMLElement | undefined)?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  return (
    <section aria-label="Your Pods and emergencies" className="flex flex-col gap-3.5">
      <AnimatePresence initial={false}>
        {top && (
          <m.div
            key={top.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
            aria-live="assertive"
          >
            <div className="rounded-3xl bg-red p-5 text-white shadow-[0_14px_30px_-12px_rgba(221,0,0,0.55)]">
              <p className="flex items-center gap-2 text-caption font-bold">
                <span className="size-2 animate-pulse-dot rounded-full bg-white" /> Emergency near you
                <span className="ml-auto font-medium text-white/80" suppressHydrationWarning>
                  {formatRelativeTime(top.createdAt)}
                </span>
              </p>
              <p className="mt-2 text-[26px] font-extrabold leading-[1.1] tracking-[-0.8px]">
                {top.bloodType} needed at {top.facility}
              </p>
              <p className="mt-2 text-caption leading-snug text-white/85">
                {[top.location, top.requesterName ? `Requested by ${top.requesterName}` : null].filter(Boolean).join(" · ")}
                {open.length > 1 ? ` · +${open.length - 1} more open` : ""}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <Link
                  href="/dashboard/request"
                  className="rounded-full bg-white py-3 text-center text-body-sm font-bold text-red-dark transition-transform active:scale-[0.98]"
                >
                  Yes, I can help
                </Link>
                <button
                  type="button"
                  onClick={() => setDismissed((d) => [...d, top.id])}
                  className="rounded-full border border-white/70 py-3 text-body-sm font-bold text-white transition-transform active:scale-[0.98]"
                >
                  Not now
                </button>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {pods.length === 0 ? (
        <EmptySlide />
      ) : (
        <div>
          <ul
            ref={scroller}
            onScroll={onScroll}
            className="-mx-3.5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {pods.map((pod) => (
              <li key={pod.id} className={cn("snap-start", slides > 1 ? "w-[90%] shrink-0" : "w-full")}>
                <PodSlide pod={pod} quiet={emergencies.length === 0} />
              </li>
            ))}
            <li className="w-[90%] shrink-0 snap-start">
              <CreatePodCard owned={allowance.owned} limit={allowance.limit} firstName={firstName} variant="slide" />
            </li>
          </ul>

          {slides > 1 && (
            <div className="mt-2.5 flex items-center justify-center gap-1.5" role="tablist" aria-label="Choose a Pod">
              {Array.from({ length: slides }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={pods[i] ? `Show ${pods[i].name}` : "Show start another Pod"}
                  onClick={() => goTo(i)}
                  className={cn("h-1.5 rounded-full transition-all", i === active ? "w-5 bg-panel" : "w-1.5 bg-ink-faint/50")}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
