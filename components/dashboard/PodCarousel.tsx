"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PodListItem } from "@/lib/pod-data";
import { POD_READY_THRESHOLD } from "@/components/dashboard/PodReadyCard";
import { CreatePodCard } from "@/components/pod/CreatePodCard";

/** Every Pod the person owns or has joined, as swipeable cards on the dashboard. */
export function PodCarousel({
  pods,
  allowance,
  firstName,
}: {
  pods: PodListItem[];
  /** How many Pods the person owns and may own; the add card shows only while there is room. */
  allowance: { owned: number; limit: number };
  firstName?: string | null;
}) {
  // The last slide is always there: the create card, or a note that the limit is reached.
  const slideCount = pods.length + 1;
  const scroller = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    const slide = el.firstElementChild as HTMLElement | null;
    if (!slide) return;
    const step = slide.offsetWidth + 12; // card width + gap
    setActive(Math.min(slideCount - 1, Math.max(0, Math.round(el.scrollLeft / step))));
  }

  function goTo(i: number) {
    const el = scroller.current;
    const slide = el?.children[i] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  return (
    <section aria-label="Your Pods">
      <ul
        ref={scroller}
        onScroll={onScroll}
        className="-mx-3.5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3.5 pb-2 [scrollbar-width:none] lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {pods.map((pod) => {
          const ready = pod.readyCount >= POD_READY_THRESHOLD;
          const extra = Math.max(pod.memberCount - pod.avatars.length, 0);
          const owner = pod.role === "owner";
          return (
            <li
              key={pod.id}
              className={cn(
                "snap-start rounded-2xl border-[0.5px] border-hairline bg-card p-4 shadow-raised lg:p-6",
                slideCount > 1 ? "w-[88%] shrink-0 lg:w-full" : "w-full",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-body-sm font-bold text-ink lg:text-title">{pod.name}</p>
                  <p className="truncate text-caption text-ink-muted">
                    {owner ? "You own this Pod" : `Owned by ${pod.ownerName}`} · {pod.readyCount} of {pod.memberCount} can
                    donate now
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-caption font-bold",
                    ready ? "bg-success-soft text-success-strong" : "bg-surface text-ink-mid",
                  )}
                >
                  {ready ? "Pod ready" : "Building"}
                </span>
              </div>

              <div className="mt-4 flex items-center">
                <div className="flex -space-x-2">
                  {pod.avatars.map((a) => (
                    <span
                      key={a.id}
                      style={{ backgroundColor: a.bgColor, color: a.textColor }}
                      className="flex size-9 items-center justify-center rounded-full border-2 border-card text-label font-bold"
                    >
                      {a.initials}
                    </span>
                  ))}
                </div>
                {extra > 0 && <span className="ml-2 text-label font-bold text-ink-muted">+{extra}</span>}
              </div>

              {!ready && owner && (
                <p className="mt-3 text-caption text-ink-muted">
                  Get to {POD_READY_THRESHOLD} people who can donate and your Pod is ready to answer an emergency.
                </p>
              )}

              <div className="mt-4 flex gap-2">
                {owner && (
                  <Link
                    href={`/pod/${pod.id}/invite`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-red px-4 py-2.5 text-body-sm font-bold text-white transition-transform active:scale-95"
                  >
                    <UserPlus className="size-4" /> Invite
                  </Link>
                )}
                <Link
                  href={`/pod/${pod.id}`}
                  className={cn(
                    "rounded-full bg-surface px-4 py-2.5 text-center text-body-sm font-bold text-ink transition-colors hover:bg-hairline",
                    !owner && "flex-1",
                  )}
                >
                  {owner ? "Manage" : "Open Pod"}
                </Link>
              </div>
            </li>
          );
        })}

        <li className="w-[88%] shrink-0 snap-start lg:w-full">
          <CreatePodCard owned={allowance.owned} limit={allowance.limit} firstName={firstName} variant="slide" />
        </li>
      </ul>

      {slideCount > 1 && (
        <div className="mt-1 flex items-center justify-center gap-1.5" role="tablist" aria-label="Choose a Pod">
          {Array.from({ length: slideCount }).map((_, i) => (
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
    </section>
  );
}
