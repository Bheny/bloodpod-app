import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PodListItem } from "@/lib/pod-data";
import type { DependableResult } from "@/lib/pod-dependable";
import { DependableChip } from "@/components/pod/DependableCard";

export function PodListCard({ pod, dependable }: { pod: PodListItem; dependable?: DependableResult }) {
  const extra = pod.memberCount - pod.avatars.length;

  return (
    <Link
      href={`/pod/${pod.id}`}
      className="flex items-center gap-3.5 rounded-2xl border-[0.5px] border-hairline bg-white p-4 shadow-raised transition-transform active:scale-[0.99] lg:p-5"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-body-sm font-bold text-ink lg:text-title">{pod.name}</p>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-label font-bold",
              pod.role === "owner" ? "bg-red-light text-red" : "bg-surface text-ink-mid",
            )}
          >
            {pod.role === "owner" ? "Owner" : "Member"}
          </span>
        </div>

        <p className="mt-0.5 truncate text-caption text-ink-muted">
          {pod.role === "member" && <>Owned by {pod.ownerName} · </>}
          {pod.memberCount} member{pod.memberCount === 1 ? "" : "s"}
          {pod.readyCount > 0 && <> · {pod.readyCount} ready to donate</>}
        </p>
        {dependable && (
          <div className="mt-2">
            <DependableChip result={dependable} />
          </div>
        )}

        <div className="mt-2.5 flex items-center">
          <div className="flex -space-x-2">
            {pod.avatars.map((a) => (
              <span
                key={a.id}
                style={{ backgroundColor: a.bgColor, color: a.textColor }}
                className="flex size-7 items-center justify-center rounded-full border-2 border-white text-label font-bold"
              >
                {a.initials}
              </span>
            ))}
          </div>
          {extra > 0 && <span className="ml-2 text-label font-bold text-ink-muted">+{extra}</span>}
        </div>
      </div>
      <ChevronRight className="size-5 shrink-0 text-ink-faint" />
    </Link>
  );
}
