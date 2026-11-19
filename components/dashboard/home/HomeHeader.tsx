import Link from "next/link";
import { Bell, Shield } from "lucide-react";
import { getInitials } from "@/lib/formatters";

/** The phone home header: today's date, a large greeting, and two round buttons. */
export function HomeHeader({
  name,
  hasEmergency,
  isAdmin = false,
}: {
  name: string | null;
  hasEmergency: boolean;
  isAdmin?: boolean;
}) {
  const first = name?.split(" ")[0] ?? "there";
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <header className="flex items-end justify-between gap-3 px-4 pb-1 pt-5">
      <div className="min-w-0">
        <p className="text-caption font-semibold text-ink-muted">{today}</p>
        <h1 className="mt-0.5 truncate text-[34px] font-extrabold leading-[1.05] tracking-[-1.2px] text-ink">Hi {first}</h1>
      </div>

      <div className="flex shrink-0 items-center gap-2 pb-1">
        {isAdmin && (
          <Link
            href="/admin"
            aria-label="Admin"
            className="flex size-10 items-center justify-center rounded-full bg-panel text-white transition-transform active:scale-95"
          >
            <Shield className="size-[18px]" />
          </Link>
        )}
        <Link
          href="/profile/notifications"
          aria-label={hasEmergency ? "Notifications, 1 new emergency" : "Notifications"}
          className="relative flex size-10 items-center justify-center rounded-full bg-card shadow-raised transition-transform active:scale-95"
        >
          <Bell className="size-5 text-ink-mid" />
          {hasEmergency && <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-red ring-2 ring-card" />}
        </Link>
        <Link
          href="/profile"
          aria-label="Your profile"
          className="flex size-10 items-center justify-center rounded-full bg-card text-body-sm font-bold text-ink shadow-raised transition-transform active:scale-95"
        >
          {name ? getInitials(name) : "?"}
        </Link>
      </div>
    </header>
  );
}
