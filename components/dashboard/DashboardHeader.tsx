import Link from "next/link";
import { Bell, Shield } from "lucide-react";
import { getInitials } from "@/lib/formatters";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardHeader({
  name,
  bloodType,
  city,
  hasEmergency,
  isAdmin = false,
}: {
  name: string | null;
  bloodType: string | null;
  city: string | null;
  hasEmergency: boolean;
  isAdmin?: boolean;
}) {
  const first = name?.split(" ")[0] ?? "there";

  return (
    <header className="flex items-center justify-between gap-4 border-b-[0.5px] border-hairline bg-white px-4 py-3.5 lg:border-0 lg:bg-transparent lg:px-0 lg:pb-6 lg:pt-0">
      <div className="min-w-0">
        <h1 className="truncate text-[19px] font-extrabold leading-[1.1] tracking-[-0.7px] text-ink lg:text-[30px] lg:tracking-[-1px]">
          {greeting()}, {first}.
        </h1>
        <p className="mt-1 truncate text-caption font-medium text-ink-muted lg:text-body-sm">
          {[bloodType, city].filter(Boolean).join(" · ") || "Add your blood type and city in Profile"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2.5 text-caption font-bold text-white transition-transform active:scale-95 lg:hidden"
          >
            <Shield className="size-3.5" /> Admin
          </Link>
        )}
        <Link
          href="/profile/notifications"
          aria-label={hasEmergency ? "Notifications, 1 new emergency" : "Notifications"}
          className="relative flex size-10 items-center justify-center rounded-full bg-surface transition-colors hover:bg-hairline lg:bg-white lg:shadow-raised"
        >
          <Bell className="size-5 text-ink-mid" />
          {hasEmergency && <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-red ring-2 ring-white" />}
        </Link>
        <Link
          href="/profile"
          aria-label="Your profile"
          className="flex size-10 items-center justify-center rounded-full bg-red text-sm font-bold text-white transition-transform active:scale-95"
        >
          {name ? getInitials(name) : "?"}
        </Link>
      </div>
    </header>
  );
}
