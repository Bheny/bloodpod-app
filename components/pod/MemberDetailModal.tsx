import { Modal } from "@/components/ui/Modal";
import { StatusDot, type StatusDotColor } from "@/components/ui/StatusDot";
import { formatDate } from "@/lib/formatters";
import type { PodMemberView } from "@/lib/pod-data";

function statusFor(member: PodMemberView): StatusDotColor {
  if (!member.bloodType) return "grey";
  return member.isEligible ? "green" : "amber";
}

export function MemberDetailModal({
  member,
  onClose,
}: {
  member: PodMemberView | null;
  onClose: () => void;
}) {
  return (
    <Modal open={Boolean(member)} onClose={onClose}>
      {member && (
        <div>
          <div className="flex items-center gap-3">
            {member.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- external OAuth-provider URL, not a local/optimizable asset
              <img
                src={member.avatarUrl}
                alt={member.name}
                className="size-14 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span
                style={{ backgroundColor: member.bgColor, color: member.textColor }}
                className="flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold"
              >
                {member.initials}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-base font-extrabold text-ink">{member.name}</p>
                {member.isCurrentUser ? (
                  <span className="shrink-0 rounded-full bg-red-light px-1.5 py-0.5 text-[8px] font-bold text-red">
                    You
                  </span>
                ) : (
                  member.isOwner && (
                    <span className="shrink-0 rounded-full bg-surface px-1.5 py-0.5 text-[8px] font-bold text-ink-muted">
                      Owner
                    </span>
                  )
                )}
              </div>
              <p className="text-xs text-ink-muted">Member since {formatDate(member.joinedAt)}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-surface py-3 text-center">
              <p
                className="text-base font-extrabold"
                style={{ color: member.bloodType === "O+" ? "#DD0000" : "#1C1C1E" }}
              >
                {member.bloodType ?? "—"}
              </p>
              <p className="text-[9px] text-ink-muted">Blood type</p>
            </div>
            <div className="rounded-xl bg-surface py-3 text-center">
              <p className="text-base font-extrabold text-ink">{member.donationCount}</p>
              <p className="text-[9px] text-ink-muted">
                Donation{member.donationCount === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex flex-col items-center justify-center gap-1 rounded-xl bg-surface py-3 text-center">
              <span className="flex items-center gap-1.5">
                <StatusDot status={statusFor(member)} />
                <p className="text-[11px] font-extrabold text-ink">
                  {member.isEligible ? "Eligible" : "Not yet"}
                </p>
              </span>
              <p className="text-[9px] text-ink-muted">Status</p>
            </div>
          </div>

          {!member.isEligible && member.nextEligible && (
            <p className="mt-3 text-center text-xs text-ink-muted">
              Eligible again from {formatDate(member.nextEligible)}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
