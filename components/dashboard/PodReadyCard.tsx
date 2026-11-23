import Link from "next/link";
import { UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { InfoTip } from "@/components/ui/InfoTip";

/** A Pod counts as ready when at least this many members can donate right now. */
export const POD_READY_THRESHOLD = 3;

export interface PodReadyMember {
  id: string;
  name: string;
  initials: string;
  bgColor: string;
  isEligible: boolean;
}

export function PodReadyCard({
  podName,
  memberCount,
  readyCount,
  members,
  compact = false,
}: {
  podName: string;
  memberCount: number;
  readyCount: number;
  members: PodReadyMember[];
  /** Hide the Invite and Manage buttons, for pages that already show them. */
  compact?: boolean;
}) {
  const ready = readyCount >= POD_READY_THRESHOLD;
  const extra = Math.max(memberCount - members.length, 0);

  return (
    <section className="rounded-3xl border-[0.5px] border-hairline bg-card lg:rounded-2xl p-4 shadow-raised lg:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-body-sm font-bold text-ink lg:text-title">{podName}</p>
          <p className="text-caption text-ink-muted">
            {readyCount} of {memberCount} can donate now
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-caption font-bold",
              ready ? "bg-success-soft text-success-strong" : "bg-surface text-ink-mid",
            )}
          >
            {ready ? "Pod ready" : "Building"}
          </span>
          <InfoTip term="podReady" />
        </div>
      </div>

      <div className="mt-4 flex -space-x-2">
        {members.map((m) => (
          <span
            key={m.id}
            title={`${m.name}${m.isEligible ? "" : " (resting)"}`}
            style={{ backgroundColor: m.bgColor }}
            className={cn(
              "relative flex size-9 items-center justify-center rounded-full border-2 border-card text-label font-bold text-ink",
              !m.isEligible && "opacity-50",
            )}
          >
            {m.initials}
          </span>
        ))}
        {extra > 0 && (
          <span className="flex size-9 items-center justify-center rounded-full border-2 border-card bg-surface text-label font-bold text-ink-muted">
            +{extra}
          </span>
        )}
      </div>

      {!ready && (
        <p className="mt-3 text-caption text-ink-muted">
          Get to {POD_READY_THRESHOLD} people who can donate and your Pod is ready to answer an emergency.
        </p>
      )}

      {!compact && (
      <div className="mt-4 flex gap-2">
        <Link
          href="/pod/invite"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-red px-4 py-2.5 text-body-sm font-bold text-white transition-transform active:scale-95"
        >
          <UserPlus className="size-4" /> Invite
        </Link>
        <Link
          href="/pod"
          className="rounded-full bg-surface px-4 py-2.5 text-body-sm font-bold text-ink transition-colors hover:bg-hairline"
        >
          Manage
        </Link>
      </div>
      )}
    </section>
  );
}
