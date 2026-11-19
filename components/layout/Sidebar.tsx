"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { NAV_TABS } from "@/lib/nav-tabs";
import { getInitials } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";
import { SendAlertButton } from "@/components/dashboard/SendAlertButton";
import { AdminSwitch } from "@/components/layout/AdminSwitch";
import { cn } from "@/lib/utils";

export interface SidebarUser {
  name: string | null;
  bloodType: string | null;
  hasPush: boolean;
}

export function Sidebar({ user, isAdmin = false }: { user: SidebarUser | null; isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r-[0.5px] border-hairline bg-card lg:flex">
      <div className="px-6 py-6">
        <Logo />
      </div>

      {isAdmin && (
        <div className="px-3 pb-3">
          <AdminSwitch active="platform" />
        </div>
      )}

      <nav aria-label="Primary" className="flex flex-col gap-1 px-3">
        {NAV_TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-150",
                active ? "bg-red-light text-red-fg" : "text-ink-mid hover:bg-surface",
              )}
            >
              <Icon className={cn("size-5", active ? "text-red-fg" : "text-ink-faint")} />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 p-3">
        <SendAlertButton variant="block" className="w-full" />

        {user && (
          <div className="rounded-2xl bg-surface p-3">
            <Link href="/profile" className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red text-xs font-bold text-white">
                {user.name ? getInitials(user.name) : "?"}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-body-sm font-bold text-ink">{user.name ?? "BloodPod member"}</span>
                <span className="flex items-center gap-1.5 text-caption text-ink-muted">
                  {user.bloodType ?? "No blood type"}
                  <span aria-hidden="true">·</span>
                  <span
                    className={cn("inline-block size-1.5 rounded-full", user.hasPush ? "bg-[#1FA855]" : "bg-[#F59E0B]")}
                  />
                  {user.hasPush ? "Alerts on" : "Alerts off"}
                </span>
              </span>
            </Link>
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              className="mt-3 flex w-full items-center gap-2 rounded-lg px-1 py-1 text-caption font-semibold text-ink-muted transition-colors hover:text-ink disabled:opacity-60"
            >
              <LogOut className="size-3.5" />
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
