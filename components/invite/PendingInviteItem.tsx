"use client";

export interface PendingInvite {
  id: string;
  email: string | null;
  token: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

function displayStatus(invite: PendingInvite): "Pending" | "Joined" | "Expired" {
  if (invite.status === "ACCEPTED") return "Joined";
  if (new Date(invite.expiresAt) < new Date()) return "Expired";
  return "Pending";
}

export function PendingInviteItem({
  invite,
  resendState,
  onResend,
  onCancel,
}: {
  invite: PendingInvite;
  resendState: "idle" | "sending" | "sent";
  onResend: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const status = displayStatus(invite);

  return (
    <div className="flex items-center justify-between px-2.5 py-2.5">
      <p className="truncate text-[9px] font-medium text-ink">
        {invite.email ?? "Shared link"}
      </p>

      <div className="flex shrink-0 items-center gap-2.5">
        <span
          className="text-[9px] font-bold"
          style={{
            color: status === "Pending" ? "#92400E" : status === "Joined" ? "#166534" : "#8E8E93",
          }}
        >
          {status === "Joined" ? "Joined ✓" : status}
        </span>
        {status === "Pending" && (
          <button
            type="button"
            onClick={() => onResend(invite.id)}
            disabled={resendState !== "idle"}
            className="text-[8px] font-bold text-red disabled:opacity-60"
          >
            {resendState === "sending" ? "Sending…" : resendState === "sent" ? "Sent ✓" : "Resend"}
          </button>
        )}
        <button
          type="button"
          aria-label="Cancel invite"
          onClick={() => onCancel(invite.id)}
          className="text-sm text-ink-faint"
        >
          ×
        </button>
      </div>
    </div>
  );
}
