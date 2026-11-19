"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import type { ReceivedInvitation } from "@/lib/pod-invitations";

/** Invites sent to this person's email, so they can be answered without the original link. */
export function PodInvitations({ invitations }: { invitations: ReceivedInvitation[] }) {
  const router = useRouter();
  const [items, setItems] = useState(invitations);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) return null;

  async function respond(inv: ReceivedInvitation, action: "join" | "decline") {
    setBusy(inv.id);
    setError(null);
    try {
      const res = await fetch(
        action === "join" ? `/api/invite/${inv.token}/accept` : `/api/pod/invitations/${inv.id}/decline`,
        { method: "POST" },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong. Please try again.");
      }
      setItems((list) => list.filter((i) => i.id !== inv.id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardTitle aside={<span className="text-caption font-bold text-red-fg">{items.length} new</span>}>
        Pod invitations
      </CardTitle>
      <ul className="mt-3 flex flex-col gap-2.5">
        {items.map((inv) => (
          <li key={inv.id} className="rounded-xl bg-surface p-3.5">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-light">
                <HeartHandshake className="size-4 text-red-fg" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-sm font-bold text-ink">{inv.podName}</p>
                <p className="text-caption text-ink-muted">
                  {inv.inviterName} invited you · {inv.memberCount} member{inv.memberCount === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            {inv.full ? (
              <p className="mt-3 text-caption text-ink-muted">This Pod is full right now. Ask {inv.inviterName} to make room.</p>
            ) : (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => respond(inv, "join")}
                  disabled={busy === inv.id}
                  className="flex-1 rounded-full bg-red py-2.5 text-body-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-60"
                >
                  {busy === inv.id ? "Joining..." : "Join"}
                </button>
                <button
                  type="button"
                  onClick={() => respond(inv, "decline")}
                  disabled={busy === inv.id}
                  className="rounded-full bg-card px-5 py-2.5 text-body-sm font-semibold text-ink-mid transition-colors hover:bg-hairline disabled:opacity-60"
                >
                  Decline
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {error && <p className="mt-3 text-caption text-red-fg">{error}</p>}
    </Card>
  );
}
