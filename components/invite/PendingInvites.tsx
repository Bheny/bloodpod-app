"use client";

import { useState } from "react";
import { PendingInviteItem, type PendingInvite } from "@/components/invite/PendingInviteItem";

type ResendState = "idle" | "sending" | "sent";

export function PendingInvites({ initialInvites }: { initialInvites: PendingInvite[] }) {
  const [invites, setInvites] = useState(initialInvites);
  const [resendStates, setResendStates] = useState<Record<string, ResendState>>({});

  async function handleResend(id: string) {
    setResendStates((prev) => ({ ...prev, [id]: "sending" }));
    try {
      const res = await fetch(`/api/pod/invite/resend/${id}`, { method: "POST" });
      setResendStates((prev) => ({ ...prev, [id]: res.ok ? "sent" : "idle" }));
    } catch {
      setResendStates((prev) => ({ ...prev, [id]: "idle" }));
    } finally {
      setTimeout(() => {
        setResendStates((prev) => ({ ...prev, [id]: "idle" }));
      }, 2000);
    }
  }

  async function handleCancel(id: string) {
    setInvites((prev) => prev.filter((inv) => inv.id !== id));
    try {
      await fetch(`/api/pod/invite/${id}`, { method: "DELETE" });
    } catch {
      // already removed from view; a stray record can be cleaned up later
    }
  }

  return (
    <div className="px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">
        Pending invites ({invites.length})
      </p>

      {invites.length === 0 ? (
        <p className="mt-3 text-center text-xs text-ink-muted">No pending invites yet.</p>
      ) : (
        <div className="mt-2 divide-y-[0.5px] divide-surface rounded-2xl bg-white">
          {invites.map((invite) => (
            <PendingInviteItem
              key={invite.id}
              invite={invite}
              resendState={resendStates[invite.id] ?? "idle"}
              onResend={handleResend}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
