import Link from "next/link";
import { ChevronRight, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PodListItem } from "@/lib/pod-data";
import type { DependableResult } from "@/lib/pod-dependable";
import { DependableChip } from "@/components/pod/DependableCard";
import { POD_READY_THRESHOLD } from "@/components/dashboard/PodReadyCard";

/** A Pod in the list. The role badge is only shown where it isn't already obvious. */
export function PodListCard({
  pod,
  dependable,
  showRole = false,
}: {
  pod: PodListItem;
  dependable?: DependableResult;
  showRole?: boolean;
}) {
  const extra = pod.memberCount - pod.avatars.length;
  const owner = pod.role === "owner";
  const ready = pod.readyCount >= POD_READY_THRESHOLD;
  const needed = Math.max(POD_READY_THRESHOLD - pod.readyCount, 0);
  const progress = Math.min(pod.readyCount / POD_READY_THRESHOLD, 1);

  return (
    <div className="overflow-hidden rounded-2xl border-[0.5px] border-hairline bg-card shadow-raised">
      <Link
        href={`/pod/${pod.id}`}
        className="flex items-start gap-3 p-4 transition-colors active:bg-surface lg:p-5"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-body-sm font-bold text-ink lg:text-title">{pod.name}</p>
            {showRole && (
              <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-label font-bold text-ink-mid">
                Member
              </span>
            )}
          </div>

          <p className="mt-0.5 truncate text-caption text-ink-muted">
            {!owner && <>Owned by {pod.ownerName} · </>}
            {pod.memberCount} member{pod.memberCount === 1 ? "" : "s"}
          </p>

          {/* Progress to "Pod ready", the same rule as on the dashboard. */}
          <div className="mt-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-surface" role="progressbar" aria-valuemin={0} aria-valuemax={POD_READY_THRESHOLD} aria-valuenow={Math.min(pod.readyCount, POD_READY_THRESHOLD)} aria-label="People ready to donate">
              <div
                className={cn("h-full rounded-full transition-all", ready ? "bg-[#1FA855]" : "bg-red")}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <p className={cn("mt-1.5 text-caption font-semibold", ready ? "text-success-strong" : "text-ink-mid")}>
              {ready
                ? `Pod ready · ${pod.readyCount} can donate now`
                : `${pod.readyCount} of ${POD_READY_THRESHOLD} ready${owner ? ` · add ${needed} more` : ""}`}
            </p>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex -space-x-2">
              {pod.avatars.map((a) => (
                <span
                  key={a.id}
                  style={{ backgroundColor: a.bgColor, color: a.textColor }}
                  className="flex size-7 items-center justify-center rounded-full border-2 border-card text-label font-bold"
                >
                  {a.initials}
                </span>
              ))}
              {extra > 0 && (
                <span className="flex size-7 items-center justify-center rounded-full border-2 border-card bg-surface text-label font-bold text-ink-muted">
                  +{extra}
                </span>
              )}
            </div>
            {dependable && <DependableChip result={dependable} />}
          </div>
        </div>
        <ChevronRight className="mt-1 size-5 shrink-0 text-ink-faint" />
      </Link>

      {/* The next step, right on the card, while the Pod is still being built. */}
      {owner && !ready && (
        <Link
          href={`/pod/${pod.id}/invite`}
          className="flex items-center justify-center gap-1.5 border-t-[0.5px] border-hairline bg-red-light/50 py-2.5 text-body-sm font-bold text-red-fg transition-colors hover:bg-red-light"
        >
          <UserPlus className="size-4" /> Invite people
        </Link>
      )}
    </div>
  );
}
