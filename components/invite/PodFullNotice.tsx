import { Lock } from "lucide-react";
import { FREE_POD_MEMBER_LIMIT } from "@/lib/pod-limits";

export function PodFullNotice() {
  return (
    <div className="mx-3.5 mt-3.5 flex flex-col items-center gap-2 rounded-2xl border-[0.5px] border-hairline bg-white p-6 text-center shadow-raised lg:mx-6">
      <span className="flex size-11 items-center justify-center rounded-full bg-surface">
        <Lock className="size-5 text-ink-mid" />
      </span>
      <p className="text-body-sm font-bold text-ink">Your pod is full</p>
      <p className="max-w-xs text-label text-ink-muted">
        You&apos;ve reached the {FREE_POD_MEMBER_LIMIT}-member limit on the Free plan. Upgrade to
        Pod Pro to keep growing your circle.
      </p>
      <span className="mt-1 rounded-full bg-surface px-3 py-1.5 text-label font-bold text-ink-faint">
        Pod Pro upgrade - coming soon
      </span>
    </div>
  );
}
