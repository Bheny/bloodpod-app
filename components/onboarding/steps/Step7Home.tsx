"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { LogoMark } from "@/components/ui/Logo";

const PENDING_INVITE_KEY = "pending_invite_token";

export function Step7Home() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      try {
        await fetch("/api/onboarding/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step: 7 }),
        });

        const pendingToken = localStorage.getItem(PENDING_INVITE_KEY);
        if (pendingToken) {
          await fetch(`/api/invite/${pendingToken}/accept`, { method: "POST" });
          localStorage.removeItem(PENDING_INVITE_KEY);
        }
      } catch {
        // never block the redirect to the dashboard on a network hiccup
      }

      if (!cancelled) {
        setTimeout(() => router.push("/dashboard"), 1500);
      }
    }

    finish();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
      <m.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <LogoMark className="size-12" />
      </m.div>
      <h1 className="mt-6 text-2xl font-extrabold tracking-[-0.6px] text-ink">You&apos;re ready.</h1>
      <p className="mt-2 text-sm text-ink-muted">Build your pod. Save a life.</p>
    </div>
  );
}
