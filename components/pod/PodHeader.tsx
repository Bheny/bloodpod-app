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
    <div className="border-b-[0.5px] border-hairline bg-white px-4 py-4 lg:border-b-0 lg:px-6 lg:py-6">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-light lg:size-12">
          <LogoMark className="size-5 lg:size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-extrabold tracking-[-0.4px] text-ink lg:text-[18px]">
            {podName}
          </p>
          <p className="truncate text-label text-ink-faint">bloodpod.gh/pod/{podSlug}</p>
        </div>
        <Link
          href="/pod/settings"
          aria-label="Pod settings"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface lg:size-9"
        >
          <Settings className="size-4 text-ink-mid lg:size-4.5" />
        </Link>
      </div>

      <div className="mt-3.5 grid grid-cols-3 gap-2 lg:mt-5 lg:gap-3">
        <div className="rounded-xl bg-surface py-2.5 text-center lg:py-4">
          <p className="text-base font-extrabold text-ink lg:text-[22px]">{memberCount}</p>
          <p className="text-label text-ink-muted">Members</p>
        </div>
        <div className="rounded-xl bg-surface py-2.5 text-center lg:py-4">
          <p className="text-base font-extrabold text-red lg:text-[22px]">{strengthScore}%</p>
          <p className="text-label text-ink-muted">Strength</p>
        </div>
        <div className="rounded-xl bg-surface py-2.5 text-center lg:py-4">
          <p className="text-base font-extrabold text-ink lg:text-[22px]">{typesCount}</p>
          <p className="text-label text-ink-muted">Types</p>
        </div>
      </div>
    </div>
  );
}
