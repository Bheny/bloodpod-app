"use client";

import { useState } from "react";
import { PendingInviteItem, type PendingInvite } from "@/components/invite/PendingInviteItem";

export function PendingInvites({ initialInvites }: { initialInvites: PendingInvite[] }) {
  const [invites, setInvites] = useState(initialInvites);

  async function handleResend(id: string) {
    try {
      await fetch(`/api/pod/invite/resend/${id}`, { method: "POST" });
    } catch {
      // best-effort — the invite stays visible either way
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
      <p className="text-[9px] font-bold uppercase tracking-wide text-ink-muted">
        Pending invites ({invites.length})
      </p>

      {invites.length === 0 ? (
        <p className="mt-3 text-center text-[11px] text-ink-muted">No pending invites yet.</p>
      ) : (
        <div className="mt-2 divide-y-[0.5px] divide-surface rounded-2xl bg-white">
          {invites.map((invite) => (
            <PendingInviteItem
              key={invite.id}
              invite={invite}
              onResend={handleResend}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
