import Link from "next/link";
import { Settings } from "lucide-react";
import { LogoMark } from "@/components/ui/Logo";

export function PodHeader({
  podName,
  podSlug,
  memberCount,
  strengthScore,
  typesCount,
}: {
  podName: string;
  podSlug: string;
  memberCount: number;
  strengthScore: number;
  typesCount: number;
}) {
  return (
    <div className="border-b-[0.5px] border-[#E5E5EA] bg-white px-4 py-4">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-light">
          <LogoMark className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-extrabold tracking-[-0.4px] text-ink">{podName}</p>
          <p className="truncate text-[8px] text-ink-faint">bloodpod.gh/pod/{podSlug}</p>
        </div>
        <Link
          href="/pod/settings"
          aria-label="Pod settings"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface"
        >
          <Settings className="size-4 text-ink-mid" />
        </Link>
      </div>

      <div className="mt-3.5 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-surface py-2.5 text-center">
          <p className="text-base font-extrabold text-ink">{memberCount}</p>
          <p className="text-[9px] text-ink-muted">Members</p>
        </div>
        <div className="rounded-xl bg-surface py-2.5 text-center">
          <p className="text-base font-extrabold text-red">{strengthScore}%</p>
          <p className="text-[9px] text-ink-muted">Strength</p>
        </div>
        <div className="rounded-xl bg-surface py-2.5 text-center">
          <p className="text-base font-extrabold text-ink">{typesCount}</p>
          <p className="text-[9px] text-ink-muted">Types</p>
        </div>
      </div>
    </div>
  );
}
