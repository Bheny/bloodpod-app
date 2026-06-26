import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const res = await fetch(`${origin}/api/auth/complete-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supabaseId: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name,
        }),
      });
      const { user } = await res.json();
      return NextResponse.redirect(`${origin}${user?.onboardingComplete ? "/dashboard" : "/onboarding"}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=oauth`);
}
