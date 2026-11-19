import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { PushToggle } from "@/components/pwa/PushToggle";
import { cn } from "@/lib/utils";

/** People to invite (besides you) before a Pod counts as started. */
const INVITE_GOAL = 3;

export function hasOpenNextSteps({ hasPush, memberCount }: { hasPush: boolean; memberCount: number }) {
  return !hasPush || memberCount - 1 < INVITE_GOAL;
}

export function NextSteps({ hasPush, memberCount }: { hasPush: boolean; memberCount: number }) {
  const invited = Math.max(0, Math.min(memberCount - 1, INVITE_GOAL));
  const inviteDone = invited >= INVITE_GOAL;

  return (
    <section className="rounded-2xl border-[0.5px] border-hairline bg-card p-4 shadow-raised lg:p-6">
      <p className="text-body-sm font-bold text-ink lg:text-title">Get ready</p>
      <p className="mt-0.5 text-caption text-ink-muted lg:text-body-sm">Two things make your Pod work in an emergency.</p>

      <ul className="mt-4 space-y-3">
        <li className="flex items-start gap-3">
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

        <li className="flex items-start gap-3">
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
    </section>
  );
}
