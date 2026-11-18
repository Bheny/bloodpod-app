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
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-surface"
    >
      {member.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not a local optimizable asset
        <img
          src={member.avatarUrl}
          alt={member.name}
          className="size-9 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          style={{ backgroundColor: member.bgColor, color: member.textColor }}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-caption font-bold"
        >
          {member.initials}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-body-sm font-semibold text-ink">{member.name}</p>
          {member.isCurrentUser ? (
            <span className="rounded-full bg-red-light px-1.5 py-0.5 text-label font-bold text-red">
              You
            </span>
          ) : (
            member.isOwner && (
              <span className="rounded-full bg-surface px-1.5 py-0.5 text-label font-bold text-ink-muted">
                Owner
              </span>
            )
          )}
        </div>
        <p className="truncate text-caption text-ink-muted">
          {member.donationCount} donation{member.donationCount === 1 ? "" : "s"} ·{" "}
          {member.isEligible ? "eligible" : "not yet eligible"}
        </p>
      </div>

      <p
        className="shrink-0 text-body-sm font-extrabold"
        style={{ color: member.bloodType === "O+" ? "#DD0000" : "#1C1C1E" }}
      >
        {member.bloodType ?? "—"}
      </p>
      <StatusDot status={statusFor(member)} />
    </button>
  );
}
