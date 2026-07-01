"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_TABS } from "@/lib/nav-tabs";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r-[0.5px] border-[#E5E5EA] bg-white lg:flex">
      <div className="px-6 py-6">
        <Logo />
      </div>

      <nav aria-label="Primary" className="flex flex-col gap-1 px-3">
        {NAV_TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-150",
                active ? "bg-red-light text-red" : "text-ink-mid hover:bg-surface",
              )}
            >
              <Icon className={cn("size-5", active ? "text-red" : "text-ink-faint")} />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
