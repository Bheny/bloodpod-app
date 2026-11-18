"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";

export function HospitalHeader({ userName }: { userName: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b-[0.5px] border-[#E5E5EA] bg-white">
      <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-6">
        <Link href="/hospital" className="flex items-center gap-3">
          <Logo />
          <span className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">
            Hospitals
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {userName && <span className="hidden text-sm text-ink-mid sm:block">{userName}</span>}
          <button
            type="button"
            onClick={signOut}
            disabled={busy}
            className="text-sm font-semibold text-ink-mid hover:text-ink disabled:opacity-60"
          >
            {busy ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    </header>
  );
}
