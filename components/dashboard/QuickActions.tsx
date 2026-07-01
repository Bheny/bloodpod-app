import Link from "next/link";
import { Link2, Droplet, AlertTriangle, Search, type LucideIcon } from "lucide-react";

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
    iconBg: "#F2F2F2",
    iconColor: "#48484A",
  },
  {
    href: "/passport/log",
    label: "Log donation",
    sub: "Update your passport",
    icon: Droplet,
    iconBg: "#F2F2F2",
    iconColor: "#48484A",
  },
  {
    href: "/dashboard/request",
    label: "Request blood",
    sub: "Alert your pod",
    icon: AlertTriangle,
    iconBg: "#FFF0F0",
    iconColor: "#DD0000",
  },
  {
    href: "/discover",
    label: "Find donors",
    sub: "Search nearby",
    icon: Search,
    iconBg: "#F2F2F2",
    iconColor: "#48484A",
  },
];

export function QuickActions() {
  return (
    <div>
      <p className="text-body-sm font-bold text-ink lg:text-title">Quick actions</p>
      <div className="mt-2.5 grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-2xl bg-white px-3 py-[13px] shadow-raised transition-transform duration-150 active:scale-[0.97] lg:px-4 lg:py-4"
            >
              <span
                className="flex size-8 items-center justify-center rounded-xl lg:size-10"
                style={{ backgroundColor: action.iconBg }}
              >
                <Icon className="size-4 lg:size-5" style={{ color: action.iconColor }} />
              </span>
              <p className="mt-2 text-label font-bold tracking-[-0.2px] text-ink">
                {action.label}
              </p>
              <p className="text-label text-ink-muted">{action.sub}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
