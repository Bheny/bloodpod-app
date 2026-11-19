"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Building2,
  FlaskConical,
  LayoutDashboard,
  Network,
  Siren,
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
  { href: "/admin/hospitals", label: "Hospitals", icon: Building2, badge: "hospitals" },
  { href: "/admin/services", label: "Services", icon: FlaskConical },
  { href: "/admin/emergencies", label: "Emergencies", icon: Siren, badge: "emergencies" },
  { href: "/admin/finance", label: "Finance", icon: Wallet },
];

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
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r-[0.5px] border-hairline bg-white lg:flex">
        <div className="flex items-center gap-2 px-6 py-6">
          <Logo />
          <span className="rounded-full bg-ink px-2 py-0.5 text-label font-bold uppercase tracking-wide text-white">Admin</span>
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
                  active ? "bg-red-light text-red" : "text-ink-mid hover:bg-surface",
                )}
              >
                <item.icon className={cn("size-5", active ? "text-red" : "text-ink-faint")} />
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

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 border-b-[0.5px] border-hairline bg-white lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2">
            <Logo />
            <span className="rounded-full bg-ink px-2 py-0.5 text-label font-bold uppercase tracking-wide text-white">Admin</span>
          </span>
          <AdminSwitch active="admin" className="w-44" />
        </div>
        <nav aria-label="Admin" className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2">
          {NAV.map((item) => {
            const active = isActive(item.href);
            const count = item.badge ? badges[item.badge] : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-caption font-bold transition-colors",
                  active ? "bg-red text-white" : "bg-surface text-ink-mid",
                )}
              >
                {item.label}
                {count > 0 && (
                  <span className={cn("rounded-full px-1.5 text-label", active ? "bg-white/25" : "bg-red text-white")}>
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="lg:pl-60">
        <div className="mx-auto max-w-[1240px] px-4 py-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
