import Link from "next/link";
import { LogoMark } from "@/components/ui/Logo";

export interface PodSummaryMember {
  id: string;
  name: string;
  initials: string;
  bgColor: string;
}

export function PodSummaryCard({
  podName,
  podSlug,
  memberCount,
  members,
  plan,
}: {
  podName: string;
  podSlug: string;
  memberCount: number;
  members: PodSummaryMember[];
  plan: string;
}) {
  const extra = Math.max(memberCount - members.length, 0);

  return (
    <div className="rounded-2xl bg-white p-[15px]">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-bold text-ink">{podName}</p>
        <Link href="/pod" className="text-xs font-bold text-red">
          Manage
        </Link>
      </div>

      <div className="mt-3 flex items-center gap-2.5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-light">
          <LogoMark className="size-6" />
        </span>
        <div>
          <p className="text-sm font-bold text-ink">{podName}</p>
          <p className="text-[10px] text-ink-faint">bloodpod.gh/pod/{podSlug}</p>
        </div>
      </div>

      <div className="mt-3 flex -space-x-[7px]">
        {members.map((m) => (
          <span
            key={m.id}
            style={{ backgroundColor: m.bgColor }}
            className="flex size-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-ink"
          >
            {m.initials}
          </span>
        ))}
        {extra > 0 && (
          <span className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-surface text-[10px] font-bold text-ink-muted">
            +{extra}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-[11px] text-ink-muted">
          {memberCount} of 20 · {plan === "PREMIUM" ? "Pod Pro" : "Free"}
        </p>
        <span className="rounded-full bg-[#F0FDF4] px-2 py-0.5 text-[10px] font-bold text-[#166534]">
          Active
        </span>
      </div>
    </div>
  );
}
