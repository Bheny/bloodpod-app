import Link from "next/link";
import { StatusDot, type StatusDotColor } from "@/components/ui/StatusDot";
import type { PodMemberView } from "@/lib/pod-data";

function statusFor(member: PodMemberView): StatusDotColor {
  if (!member.bloodType) return "grey";
  return member.isEligible ? "green" : "amber";
}

export function MemberItem({ member }: { member: PodMemberView }) {
  return (
    <Link
      href={`/pod/member/${member.id}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-surface"
    >
      <span
        style={{ backgroundColor: member.bgColor, color: member.textColor }}
        className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
      >
        {member.initials}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[10px] font-semibold text-ink">{member.name}</p>
          {member.isCurrentUser ? (
            <span className="rounded-full bg-red-light px-1.5 py-0.5 text-[8px] font-bold text-red">
              You
            </span>
          ) : (
            member.isOwner && (
              <span className="rounded-full bg-surface px-1.5 py-0.5 text-[8px] font-bold text-ink-muted">
                Owner
              </span>
            )
          )}
        </div>
        <p className="truncate text-[9px] text-ink-muted">
          {member.donationCount} donation{member.donationCount === 1 ? "" : "s"} ·{" "}
          {member.isEligible ? "eligible" : "not yet eligible"}
        </p>
      </div>

      <p
        className="shrink-0 text-[10px] font-extrabold"
        style={{ color: member.bloodType === "O+" ? "#DD0000" : "#1C1C1E" }}
      >
        {member.bloodType ?? "—"}
      </p>
      <StatusDot status={statusFor(member)} />
    </Link>
  );
}
