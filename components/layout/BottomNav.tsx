"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Search, Newspaper, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/pod", label: "My Pod", icon: Users },
  { href: "/discover", label: "Discover", icon: Search },
  { href: "/feed", label: "Feed", icon: Newspaper },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t-[0.5px] border-[#E5E5EA] bg-white pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-1 flex-col items-center justify-center gap-1"
          >
            <Icon
              className={cn(
                "size-5 transition-transform duration-200",
                active ? "scale-110 text-red" : "text-ink-faint",
              )}
            />
            <span className={cn("text-[10px] font-semibold", active ? "text-red" : "text-ink-faint")}>
              {tab.label}
            </span>
            <span
              className={cn(
                "size-1 rounded-full bg-red transition-transform duration-150",
                active ? "scale-100" : "scale-0",
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}
