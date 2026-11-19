"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";

export function LabHeader({ labName }: { labName: string }) {
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
      <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between gap-3 px-4 lg:px-6">
        <Link href="/lab" className="flex min-w-0 items-center gap-3">
          <Logo />
          <span className="shrink-0 rounded-full bg-surface px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-muted">
            Labs
          </span>
        </Link>
        <div className="flex min-w-0 items-center gap-4">
          <span className="hidden truncate text-sm font-bold text-ink-mid sm:block">{labName}</span>
          <button
            type="button"
            onClick={signOut}
            disabled={busy}
            className="shrink-0 rounded-full bg-surface px-4 py-2 text-caption font-bold text-ink-mid hover:bg-hairline disabled:opacity-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
