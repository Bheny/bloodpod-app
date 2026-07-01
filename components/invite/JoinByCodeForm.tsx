"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseInviteIdentifier } from "@/lib/invite-identifier";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function JoinByCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinedPod, setJoinedPod] = useState<string | null>(null);

  async function handleJoin() {
    const identifier = parseInviteIdentifier(code);
    if (!identifier) return;

    setJoining(true);
    setError(null);
    try {
      const res = await fetch(`/api/invite/${identifier}/accept`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "That code didn't work");
      if (data.alreadyOwner) {
        setError("That's your own pod's code — share it with someone else instead.");
        return;
      }
      setJoinedPod(data.pod.name);
      setCode("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code didn't work");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="rounded-2xl border-[0.5px] border-hairline bg-white px-3.5 py-3 shadow-raised lg:px-5 lg:py-4">
      <p className="text-caption font-bold text-ink lg:text-body-sm">Have a pod code?</p>
      <p className="text-label text-ink-muted">
        Join a friend&apos;s pod with their code or link
      </p>

      {joinedPod ? (
        <p className="mt-2 text-sm font-semibold text-[#1FA855] lg:text-base">
          You joined {joinedPod} ✓
        </p>
      ) : (
        <div className="mt-2 flex gap-2">
          <Input
            placeholder="Enter code or link"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 text-sm lg:py-3"
          />
          <Button onClick={handleJoin} loading={joining} disabled={!code.trim()} size="sm">
            Join
          </Button>
        </div>
      )}
      {error && <p className="mt-1.5 text-xs text-red lg:text-sm">{error}</p>}
    </div>
  );
}
