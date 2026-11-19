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

  const place = [bloodType, city].filter(Boolean).join(" · ") || "Add your blood type and city in Profile";

  return (
    <>
    <header className="flex items-center justify-between gap-3 border-b-[0.5px] border-hairline bg-card px-4 py-3.5 lg:border-0 lg:bg-transparent lg:px-0 lg:pb-6 lg:pt-0">
      <div className="min-w-0">
        {/* On desktop the greeting lives here; on mobile it moves into the page below. */}
        <h1 className="hidden truncate text-[30px] font-extrabold leading-[1.1] tracking-[-1px] text-ink lg:block">
          {greeting()}, {first}.
        </h1>
        <p className="truncate text-body-sm font-bold text-ink lg:mt-1 lg:font-medium lg:text-ink-muted">{place}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isAdmin && (
          <Link
            href="/admin"
            aria-label="Admin"
            title="Admin"
            className="flex size-10 items-center justify-center rounded-full bg-panel text-white transition-transform active:scale-95 lg:hidden"
          >
            <Shield className="size-[18px]" />
          </Link>
        )}
        <Link
          href="/profile/notifications"
          aria-label={hasEmergency ? "Notifications, 1 new emergency" : "Notifications"}
          className="relative flex size-10 items-center justify-center rounded-full bg-surface transition-colors hover:bg-hairline lg:bg-card lg:shadow-raised"
        >
          <Bell className="size-5 text-ink-mid" />
          {hasEmergency && <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-red ring-2 ring-card" />}
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
    <p className="px-4 pt-4 text-[26px] font-extrabold leading-[1.1] tracking-[-0.9px] text-ink lg:hidden">
      {greeting()}, {first}.
    </p>
    </>
  );
}
