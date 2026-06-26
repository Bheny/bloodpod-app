"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import type { InvitePreview } from "@/lib/invite";

function initialsAvatarBg(name: string | null) {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "??";
}

export function InviteLanding({
  token,
  preview,
  isAuthenticated,
}: {
  token: string;
  preview: InvitePreview;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch(`/api/invite/${token}/accept`, { method: "POST" });
      if (!res.ok) throw new Error();
      setAccepted(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch {
      setError("Something went wrong. Please try again.");
      setAccepting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-[400px] rounded-3xl border-[0.5px] border-[#E5E5EA] bg-white p-6">
        <div className="flex justify-center">
          <Logo />
        </div>

        {accepted ? (
          <div className="mt-8 text-center">
            <p className="text-lg font-extrabold text-ink">You&apos;re in {preview.pod.name}!</p>
            <p className="mt-1 text-sm text-ink-muted">Taking you to your dashboard...</p>
          </div>
        ) : (
          <>
            <div className="mt-6 flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red text-sm font-bold text-white">
                {initialsAvatarBg(preview.inviter.name)}
              </span>
              <div>
                <p className="text-[11px] text-ink-muted">You&apos;ve been invited by</p>
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-bold text-ink">{preview.inviter.name ?? "A BloodPod member"}</p>
                  {preview.inviter.bloodType && (
                    <span className="rounded-full bg-red-light px-2 py-0.5 text-[11px] font-bold text-red">
                      {preview.inviter.bloodType}
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-muted">{preview.inviter.donationCount} donations</p>
              </div>
            </div>

            <h1 className="mt-5 text-[22px] font-extrabold tracking-[-0.6px] text-ink">
              Join {preview.pod.name}
            </h1>
            <p className="mt-1 text-[13px] text-ink-muted">
              {preview.pod.memberCount} members
              {preview.bloodTypesCovered.length > 0 && (
                <> · covers {preview.bloodTypesCovered.join(", ")}</>
              )}
            </p>

            {preview.members.length > 0 && (
              <div className="mt-4 flex -space-x-2">
                {preview.members.map((m, i) => (
                  <span
                    key={i}
                    style={{ backgroundColor: m.bgColor }}
                    className="flex size-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-ink"
                  >
                    {m.initials}
                  </span>
                ))}
              </div>
            )}

            {preview.bloodTypesCovered.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1">
                {preview.bloodTypesCovered.map((bt) => (
                  <span
                    key={bt}
                    className="rounded-full bg-red-light px-2.5 py-1 text-[11px] font-bold text-red"
                  >
                    {bt}
                  </span>
                ))}
              </div>
            )}

            {error && <p className="mt-3 text-sm text-red">{error}</p>}

            {isAuthenticated ? (
              <Button onClick={handleAccept} loading={accepting} size="lg" className="mt-5 w-full">
                Accept and join pod
              </Button>
            ) : (
              <Button asChild size="lg" className="mt-5 w-full">
                <Link href={`/sign-up?invite=${token}`}>Accept invite &amp; create account</Link>
              </Button>
            )}

            <p className="mt-3 text-center text-xs">
              <Link href="/sign-up" className="font-semibold text-red">
                Create your own pod instead →
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
