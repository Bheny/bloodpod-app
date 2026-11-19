"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { PushToggle } from "@/components/pwa/PushToggle";
import { INVITE_GOAL } from "@/lib/next-steps";
import { cn } from "@/lib/utils";

export function NextSteps({ hasPush, memberCount }: { hasPush: boolean; memberCount: number }) {
  const invited = Math.max(0, Math.min(memberCount - 1, INVITE_GOAL));
  const inviteDone = invited >= INVITE_GOAL;
  const [all, setAll] = useState(false);
  const done = (hasPush ? 1 : 0) + (inviteDone ? 1 : 0);
  // On phones, show only what to do next. The finished step and the other one wait behind "See all steps".
  const stepClass = (isNext: boolean) => (all || isNext ? "" : "max-lg:hidden");
  const pushNext = !hasPush;
  const inviteNext = hasPush && !inviteDone;

  return (
    <section className="rounded-3xl border-[0.5px] border-hairline bg-card lg:rounded-2xl p-4 shadow-raised lg:p-6">
      <div className="flex items-center justify-between">
        <p className="text-body-sm font-bold text-ink lg:text-title">Get ready</p>
        <span className="rounded-full bg-surface px-2.5 py-0.5 text-label font-bold text-ink-mid lg:hidden">{done} of 2</span>
      </div>
      <p className="mt-0.5 text-caption text-ink-muted lg:text-body-sm">Two things make your Pod work in an emergency.</p>

      <ul className="mt-4 space-y-3">
        <li className={cn("flex items-start gap-3", stepClass(pushNext))}>
          <span
            className={cn(
              "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
              hasPush ? "bg-[#1FA855] text-white" : "bg-surface text-ink-muted",
            )}
          >
            {hasPush ? <Check className="size-3.5" /> : <span className="text-label font-bold">1</span>}
          </span>
          <div className="min-w-0 flex-1">
            <p className={cn("text-body-sm font-semibold", hasPush ? "text-ink-muted line-through" : "text-ink")}>
              Turn on emergency alerts
            </p>
            {!hasPush && (
              <div className="mt-2">
                <PushToggle />
              </div>
            )}
          </div>
        </li>

        <li className={cn("flex items-start gap-3", stepClass(inviteNext))}>
          <span
            className={cn(
              "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
              inviteDone ? "bg-[#1FA855] text-white" : "bg-surface text-ink-muted",
            )}
          >
            {inviteDone ? <Check className="size-3.5" /> : <span className="text-label font-bold">2</span>}
          </span>
          <div className="min-w-0 flex-1">
            <p className={cn("text-body-sm font-semibold", inviteDone ? "text-ink-muted line-through" : "text-ink")}>
              Invite {INVITE_GOAL} people to your Pod
            </p>
            {!inviteDone && (
              <>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-hairline">
                  <div
                    className="h-full rounded-full bg-red transition-all"
                    style={{ width: `${(invited / INVITE_GOAL) * 100}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-caption text-ink-muted">
                    {invited} of {INVITE_GOAL} joined
                  </span>
                  <Link href="/pod/invite" className="flex items-center gap-0.5 text-caption font-bold text-red-fg">
                    Invite <ChevronRight className="size-3.5" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </li>
      </ul>

      <button
        type="button"
        onClick={() => setAll((a) => !a)}
        aria-expanded={all}
        className="mt-3 flex w-full items-center justify-between border-t-[0.5px] border-hairline pt-3 text-caption font-bold text-ink-mid lg:hidden"
      >
        {all ? "Show less" : "See all steps"}
        <ChevronDown className={cn("size-4 transition-transform duration-200", all && "rotate-180")} />
      </button>
    </section>
  );
}
