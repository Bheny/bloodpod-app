"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { CelebrationOverlay } from "@/components/celebration/CelebrationOverlay";
import type { InvitePreview } from "@/lib/invite";

function initialsFor(name: string | null) {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "??";
}

export function InviteLanding({
  token,
  preview,
  isAuthenticated,
  isOwner,
}: {
  token: string;
  preview: InvitePreview;
  isAuthenticated: boolean;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inviterFirstName = preview.inviter.name?.split(" ")[0] ?? "Your friend";

  async function handleAccept() {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch(`/api/invite/${token}/accept`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      setAccepted(true);
      setTimeout(() => router.push("/dashboard"), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setAccepting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      {accepted && (
        <CelebrationOverlay
          title={`Welcome to ${preview.pod.name}!`}
          subtitle={`${inviterFirstName} will be glad to have you in their circle.`}
          icon={HeartHandshake}
          onDismiss={() => {}}
        />
      )}

      <div className="w-full max-w-[400px] rounded-3xl border-[0.5px] border-hairline bg-white p-6 shadow-raised">
        <div className="flex justify-center opacity-50">
          <Logo className="scale-90" />
        </div>

        {isOwner ? (
          <div className="mt-8 text-center">
            <p className="text-lg font-extrabold text-ink">This is your Pod!</p>
            <p className="mt-1 text-sm text-ink-muted">
              You&apos;re already inside {preview.pod.name}. Share this link with someone you
              trust to bring them in.
            </p>
            <Button asChild size="lg" className="mt-5 w-full">
              <Link href="/pod/invite">Manage invites</Link>
            </Button>
          </div>
        ) : accepted ? (
          <div className="mt-8 text-center">
            <p className="text-lg font-extrabold text-ink">You&apos;re in {preview.pod.name} 🎉</p>
            <p className="mt-1 text-sm text-ink-muted">Taking you to your dashboard...</p>
          </div>
        ) : (
          <>
            <div className="mt-4 flex flex-col items-center text-center">
              {preview.inviter.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- external Supabase Storage URL, not a local optimizable asset
                <img
                  src={preview.inviter.avatarUrl}
                  alt={preview.inviter.name ?? "Inviter"}
                  className="size-20 shrink-0 rounded-full object-cover ring-4 ring-red-light"
                />
              ) : (
                <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-red text-2xl font-bold text-white ring-4 ring-red-light">
                  {initialsFor(preview.inviter.name)}
                </span>
              )}

              <p className="mt-3 text-title font-extrabold tracking-[-0.4px] text-ink">
                {preview.inviter.name ?? "A BloodPod member"}
              </p>
              <p className="text-caption text-ink-muted">
                {preview.inviter.bloodType && <>{preview.inviter.bloodType} · </>}
                {preview.inviter.donationCount} donation
                {preview.inviter.donationCount === 1 ? "" : "s"} of their own
              </p>
            </div>

            <div className="mt-5 rounded-2xl bg-surface p-4">
              <p className="text-body font-medium italic leading-snug text-ink">
                &quot;If anything ever happens to me, I want you to be one of the first to
                know.&quot;
              </p>
              <p className="mt-2 text-caption font-semibold text-ink-muted">
                — {inviterFirstName}
              </p>
            </div>

            <h1 className="mt-5 text-title-lg font-extrabold tracking-[-0.6px] text-ink text-center">
              Join {preview.pod.name}
            </h1>
            <p className="mt-1.5 text-body-sm leading-snug text-ink-muted text-center">
              You&apos;ll be one of the first people notified if anyone in this circle ever needs
              blood urgently — nothing else.
            </p>

            <div className="mt-4 flex items-start gap-3 rounded-2xl bg-surface p-3.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-light">
                <HeartHandshake className="size-4 text-red" />
              </span>
              <p className="text-caption leading-snug text-ink-mid">
                A <span className="font-bold text-ink">Pod</span> is a small circle of trusted
                people who get the call first in a blood emergency. No spam, just the people who
                matter.
              </p>
            </div>

            {preview.members.length > 0 && (
              <div className="mt-4 flex items-center gap-2">
                <div className="flex -space-x-2">
                  {preview.members.map((m, i) => (
                    <span
                      key={i}
                      style={{ backgroundColor: m.bgColor }}
                      className="flex size-7 items-center justify-center rounded-full border-2 border-white text-label font-bold text-ink"
                    >
                      {m.initials}
                    </span>
                  ))}
                </div>
                <p className="text-caption text-ink-muted">
                  {preview.pod.memberCount} {preview.pod.memberCount === 1 ? "person" : "people"}{" "}
                  already have each other&apos;s back
                </p>
              </div>
            )}

            {preview.bloodTypesCovered.length > 0 && (
              <div className="mt-4">
                <p className="text-label font-semibold text-ink-muted">
                  Together, this circle covers
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {preview.bloodTypesCovered.map((bt) => (
                    <span
                      key={bt}
                      className="rounded-full bg-red-light px-2.5 py-1 text-label font-bold text-red"
                    >
                      {bt}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="mt-3 text-sm text-red">{error}</p>}

            {isAuthenticated ? (
              <Button onClick={handleAccept} loading={accepting} size="lg" className="mt-5 w-full">
                I&apos;m in — join {preview.pod.name}
              </Button>
            ) : (
              <Button asChild size="lg" className="mt-5 w-full">
                <Link href={`/sign-up?invite=${token}`}>Accept invite &amp; create account</Link>
              </Button>
            )}

            <p className="mt-3 text-center text-xs">
              <Link href="/sign-up" className="font-semibold text-ink-mid">
                Or start your own Pod instead
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
