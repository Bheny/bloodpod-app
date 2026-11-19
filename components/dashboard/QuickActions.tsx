import Link from "next/link";
import { Link2, Droplet, Search, type LucideIcon } from "lucide-react";

const ACTIONS: {
  href: string;
  label: string;
  sub: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}[] = [
  {
    href: "/pod/invite",
    label: "Invite to pod",
    sub: "Grow your circle",
    icon: Link2,
    iconBg: "var(--color-fill)",
    iconColor: "var(--color-ink-mid)",
  },
  {
    href: "/passport/log",
    label: "Log donation",
    sub: "Update your Blood Card",
    icon: Droplet,
    iconBg: "var(--color-fill)",
    iconColor: "var(--color-ink-mid)",
  },
  {
    href: "/discover",
    label: "Find donors",
    sub: "Search nearby",
    icon: Search,
    iconBg: "var(--color-fill)",
    iconColor: "var(--color-ink-mid)",
  },
];

export function QuickActions() {
  return (
    <div>
      <p className="text-body-sm font-bold text-ink lg:text-title">Quick actions</p>
      <div className="mt-2.5 grid grid-cols-3 gap-2 lg:gap-3">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center rounded-2xl bg-card px-2 py-3.5 text-center shadow-raised lg:block lg:text-left transition-transform duration-150 active:scale-[0.97] lg:px-4 lg:py-4"
            >
              <span
                className="flex size-8 items-center justify-center rounded-xl lg:size-10"
                style={{ backgroundColor: action.iconBg }}
              >
                <Icon className="size-4 lg:size-5" style={{ color: action.iconColor }} />
              </span>
              <p className="mt-2 text-caption font-bold tracking-[-0.2px] text-ink lg:text-label">
                {action.label}
              </p>
              <p className="hidden text-label text-ink-muted lg:block">{action.sub}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
