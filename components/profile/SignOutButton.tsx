"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={signingOut}
      className="flex w-full items-center gap-2.5 rounded-2xl border-[0.5px] border-hairline bg-white px-3.5 py-3 shadow-raised text-left disabled:opacity-60"
    >
      <span className="flex size-8 items-center justify-center rounded-xl bg-surface">
        <LogOut className="size-4 text-ink-mid" />
      </span>
      <span className="text-caption font-bold text-ink">
        {signingOut ? "Signing out..." : "Sign out"}
      </span>
    </button>
  );
}
