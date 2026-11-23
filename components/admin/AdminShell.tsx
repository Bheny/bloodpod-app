"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { usePathname } from "next/navigation";
import {
  Activity,
  Building2,
  FlaskConical,
  LayoutDashboard,
  Menu,
  Network,
  ShieldCheck,
  Siren,
  Trophy,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { AdminSwitch } from "@/components/layout/AdminSwitch";
import { cn } from "@/lib/utils";

const NAV: { href: string; label: string; icon: LucideIcon; badge?: "hospitals" | "emergencies" }[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/network", label: "Network", icon: Network },
  { href: "/admin/leaderboard", label: "Garden leaders", icon: Trophy },
  { href: "/admin/hospitals", label: "Hospitals", icon: Building2, badge: "hospitals" },
  { href: "/admin/services", label: "Services", icon: FlaskConical },
  { href: "/admin/emergencies", label: "Emergencies", icon: Siren, badge: "emergencies" },
  { href: "/admin/finance", label: "Finance", icon: Wallet },
];

const PRIMARY = NAV.filter((n) => ["/admin", "/admin/users", "/admin/network", "/admin/emergencies"].includes(n.href));
const MORE = NAV.filter((n) => !PRIMARY.includes(n));

export function AdminShell({
  email,
  badges,
  children,
}: {
  email: string;
  badges: { hospitals: number; emergencies: number };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const current = NAV.find((n) => isActive(n.href)) ?? NAV[0];
  const moreActive = MORE.some((n) => isActive(n.href));
  const moreBadge = MORE.reduce((sum, n) => sum + (n.badge ? badges[n.badge] : 0), 0);

  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r-[0.5px] border-hairline bg-card lg:flex">
        <div className="flex items-center gap-2 px-6 py-6">
          <Logo />
          <span className="rounded-full bg-panel px-2 py-0.5 text-label font-bold uppercase tracking-wide text-white">Admin</span>
        </div>

        <div className="px-3 pb-3">
          <AdminSwitch active="admin" />
        </div>

        <nav aria-label="Admin" className="flex flex-col gap-1 px-3">
          {NAV.map((item) => {
            const active = isActive(item.href);
            const count = item.badge ? badges[item.badge] : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                  active ? "bg-red-light text-red-fg" : "text-ink-mid hover:bg-surface",
                )}
              >
                <item.icon className={cn("size-5", active ? "text-red-fg" : "text-ink-faint")} />
                <span className="flex-1">{item.label}</span>
                {count > 0 && (
                  <span className="rounded-full bg-red px-2 py-0.5 text-label font-bold text-white">{count}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2 p-3">
          <div className="rounded-xl bg-surface px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-label font-bold uppercase tracking-wide text-ink-muted">
              <Activity className="size-3" /> Signed in as
            </p>
            <p className="mt-0.5 truncate text-caption font-semibold text-ink">{email}</p>
          </div>
        </div>
      </aside>

      {/* Mobile top bar: just who and where. Navigation lives in the bar at the bottom. */}
      <header className="sticky top-0 z-30 border-b-[0.5px] border-hairline bg-card/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2">
            <Logo />
            <span className="rounded-full bg-panel px-2 py-0.5 text-label font-bold uppercase tracking-wide text-white">Admin</span>
          </span>
          <span className="text-body-sm font-bold text-ink">{current.label}</span>
        </div>
      </header>

      {/* Mobile bottom navigation, like an app. The rest sit under More. */}
      <nav
        aria-label="Admin"
        className="fixed inset-x-0 bottom-0 z-40 border-t-[0.5px] border-hairline bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="mx-auto grid max-w-[560px] grid-cols-5">
          {PRIMARY.map((item) => {
            const active = isActive(item.href);
            const count = item.badge ? badges[item.badge] : 0;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex flex-col items-center gap-0.5 px-1 pb-2 pt-2.5 text-label font-bold transition-colors",
                    active ? "text-red-fg" : "text-ink-muted",
                  )}
                >
                  <span className="relative">
                    <item.icon className="size-6" strokeWidth={active ? 2.4 : 1.9} />
                    {count > 0 && (
                      <span className="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-red px-1 text-center text-[10px] font-bold leading-4 text-white">
                        {count}
                      </span>
                    )}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              className={cn(
                "relative flex w-full flex-col items-center gap-0.5 px-1 pb-2 pt-2.5 text-label font-bold transition-colors",
                moreActive ? "text-red-fg" : "text-ink-muted",
              )}
            >
              <span className="relative">
                <Menu className="size-6" strokeWidth={moreActive ? 2.4 : 1.9} />
                {moreBadge > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-red px-1 text-center text-[10px] font-bold leading-4 text-white">
                    {moreBadge}
                  </span>
                )}
              </span>
              More
            </button>
          </li>
        </ul>
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="More">
            <m.button
              type="button"
              aria-label="Close"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="absolute inset-0 bg-black/40"
            />
            <m.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-card px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-floating"
            >
              <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-hairline" />
              <ul className="grid gap-1.5">
                {MORE.map((item) => {
                  const active = isActive(item.href);
                  const count = item.badge ? badges[item.badge] : 0;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-3 text-body font-semibold",
                          active ? "bg-red-light text-red-fg" : "text-ink hover:bg-surface",
                        )}
                      >
                        <item.icon className="size-5" />
                        <span className="flex-1">{item.label}</span>
                        {count > 0 && <span className="rounded-full bg-red px-2 py-0.5 text-label font-bold text-white">{count}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 border-t-[0.5px] border-hairline pt-3">
                <AdminSwitch active="admin" />
                <p className="mt-3 truncate text-center text-caption text-ink-muted">Signed in as {email}</p>
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      <main className="min-w-0 overflow-x-clip lg:pl-60">
        <div className="mx-auto max-w-[1240px] px-4 pb-28 pt-5 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
