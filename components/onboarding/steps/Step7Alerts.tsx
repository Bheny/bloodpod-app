"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { PushToggle } from "@/components/pwa/PushToggle";
import { clearPendingInvites, readPendingInvites } from "@/lib/pending-invites";


export function Step7Alerts() {
  const router = useRouter();
  const [finishing, setFinishing] = useState(false);

  async function finish() {
    setFinishing(true);
    try {
      await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 7 }),
      });
      // Join every invite they opened. Each Pod is checked on its own, so one that is
      // full or expired does not stop the others.
      for (const identifier of readPendingInvites()) {
        await fetch(`/api/invite/${encodeURIComponent(identifier)}/accept`, { method: "POST" }).catch(() => {});
      }
      clearPendingInvites();
    } catch {
      // never block the redirect to the dashboard on a network hiccup
    }
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col px-6 py-6">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <m.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex size-14 items-center justify-center rounded-full bg-red-light"
        >
          <BellRing className="size-7 text-red-fg" />
        </m.span>
        <h1 className="mt-5 text-[22px] font-extrabold tracking-[-0.6px] text-ink">Last step: switch on alerts.</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Alerts are how you hear that someone needs your blood type. Without them you would only find out if you
          opened the app.
        </p>

        <div className="mt-6 space-y-3">
          <InstallPrompt />
          <PushToggle />
        </div>
      </div>

      <Button onClick={finish} loading={finishing} size="lg" className="mt-4 w-full shrink-0">
        Finish and go to my dashboard
      </Button>
      <p className="mt-3 text-center text-xs text-ink-muted">You can change this later in your profile.</p>
    </div>
  );
}
