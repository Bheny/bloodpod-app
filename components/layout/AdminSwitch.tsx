import Link from "next/link";
import { LayoutDashboard, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

// Shown only to admins. Moves between the donor platform and the admin area.
export function AdminSwitch({ active, className }: { active: "platform" | "admin"; className?: string }) {
  const item = "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-caption font-bold transition-colors";

  return (
    <div role="group" aria-label="Switch area" className={cn("flex rounded-full bg-surface p-1", className)}>
      <Link
        href="/dashboard"
        aria-current={active === "platform" ? "page" : undefined}
        className={cn(item, active === "platform" ? "bg-white text-ink shadow-raised" : "text-ink-muted hover:text-ink")}
      >
        <LayoutDashboard className="size-3.5" /> Platform
      </Link>
      <Link
        href="/admin"
        aria-current={active === "admin" ? "page" : undefined}
        className={cn(item, active === "admin" ? "bg-ink text-white shadow-raised" : "text-ink-muted hover:text-ink")}
      >
        <Shield className="size-3.5" /> Admin
      </Link>
    </div>
  );
}
