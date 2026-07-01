import { StatusDot, type StatusDotColor } from "@/components/ui/StatusDot";
import type { PodMemberView } from "@/lib/pod-data";

function statusFor(member: PodMemberView): StatusDotColor {
  if (!member.bloodType) return "grey";
  return member.isEligible ? "green" : "amber";
}

export function MemberItem({
  member,
  onSelect,
}: {
  member: PodMemberView;
  onSelect: (member: PodMemberView) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(member)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-surface lg:px-6 lg:py-4"
    >
      {member.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not a local optimizable asset
        <img
          src={member.avatarUrl}
          alt={member.name}
          className="size-7 shrink-0 rounded-full object-cover lg:size-9"
        />
      ) : (
        <span
          style={{ backgroundColor: member.bgColor, color: member.textColor }}
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold lg:size-9 lg:text-[12px]"
        >
          {member.initials}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[10px] font-semibold text-ink lg:text-[13px]">{member.name}</p>
          {member.isCurrentUser ? (
            <span className="rounded-full bg-red-light px-1.5 py-0.5 text-[8px] font-bold text-red lg:text-[10px]">
              You
            </span>
          ) : (
            member.isOwner && (
              <span className="rounded-full bg-surface px-1.5 py-0.5 text-[8px] font-bold text-ink-muted lg:text-[10px]">
                Owner
              </span>
            )
          )}
        </div>
        <p className="truncate text-[9px] text-ink-muted lg:text-[12px]">
          {member.donationCount} donation{member.donationCount === 1 ? "" : "s"} ·{" "}
          {member.isEligible ? "eligible" : "not yet eligible"}
        </p>
      </div>

      <p
        className="shrink-0 text-[10px] font-extrabold lg:text-[13px]"
        style={{ color: member.bloodType === "O+" ? "#DD0000" : "#1C1C1E" }}
      >
        {member.bloodType ?? "—"}
      </p>
      <StatusDot status={statusFor(member)} />
    </button>
  );
}
