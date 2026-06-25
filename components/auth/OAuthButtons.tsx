"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.46c-.28 1.5-1.13 2.77-2.4 3.62v3.01h3.86c2.26-2.08 3.6-5.15 3.6-8.66Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.86-3a7.18 7.18 0 0 1-4.07 1.13c-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A11.998 11.998 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.26a7.2 7.2 0 0 1 0-4.52v-3.1H1.27a12 12 0 0 0 0 10.72l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.43-3.43A11.6 11.6 0 0 0 12 0 11.998 11.998 0 0 0 1.27 6.64l4 3.1C6.22 6.9 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

export function GoogleButton({ label }: { label: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-3 rounded-full border-[1.5px] border-[#E5E5EA] bg-white py-3 font-semibold text-ink transition-colors duration-150 hover:border-ink-faint hover:bg-[#F9F9F9] disabled:opacity-60"
    >
      <GoogleIcon />
      {loading ? "Redirecting…" : label}
    </button>
  );
}
