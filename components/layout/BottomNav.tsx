"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { type LucideIcon } from "lucide-react";
import { NAV_TABS } from "@/lib/nav-tabs";
import { cn } from "@/lib/utils";

function TabContent({ active, label, Icon }: { active: boolean; label: string; Icon: LucideIcon }) {
  const { pending } = useLinkStatus();

  return (
    <>
      <Icon
        className={cn(
          "size-5 transition-transform duration-200",
          active ? "scale-110 text-red" : "text-ink-faint",
          pending && "animate-pulse",
        )}
      />
      <span className={cn("text-[10px] font-semibold", active ? "text-red" : "text-ink-faint")}>
        {label}
      </span>
      <span
        className={cn(
          "size-1 rounded-full bg-red transition-transform duration-150",
          active ? "scale-100" : "scale-0",
        )}
      />
    </>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t-[0.5px] border-[#E5E5EA] bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Primary"
    >
      {NAV_TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-1 flex-col items-center justify-center gap-1"
          >
            <TabContent active={active} label={tab.label} Icon={tab.icon} />
          </Link>
        );
      })}
    </nav>
  );
}
