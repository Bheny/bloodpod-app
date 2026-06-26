import Link from "next/link";
import {
  Bell,
  UserPlus,
  Droplet,
  Check,
  Hospital,
  Award,
  type LucideIcon,
} from "lucide-react";
import type { Activity, ActivityType } from "@prisma/client";
import { formatRelativeTime } from "@/lib/formatters";

export const ACTIVITY_ICONS: Record<ActivityType, { icon: LucideIcon; bg: string; color: string }> = {
  BLOOD_REQUEST: { icon: Bell, bg: "#FFF0F0", color: "#DD0000" },
  MEMBER_JOINED: { icon: UserPlus, bg: "#F0FDF4", color: "#166534" },
  DONATION_LOGGED: { icon: Droplet, bg: "#F0FDF4", color: "#166534" },
  INVITE_ACCEPTED: { icon: Check, bg: "#F0FDF4", color: "#166534" },
  HOSPITAL_VERIFIED: { icon: Hospital, bg: "#EFF6FF", color: "#1D4ED8" },
  BADGE_EARNED: { icon: Award, bg: "#FFFBEB", color: "#92400E" },
};

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-bold text-ink">Recent activity</p>
        <Link href="/activity" className="text-xs font-bold text-red">
          See all
        </Link>
      </div>

      {activities.length === 0 ? (
        <div className="mt-2.5 rounded-2xl bg-white p-6 text-center">
          <p className="text-sm font-bold text-ink">No activity yet.</p>
          <p className="mt-1 text-xs text-ink-muted">
            Invite someone to your pod to get started.
          </p>
          <Link href="/pod/invite" className="mt-2 inline-block text-sm font-bold text-red">
            Invite now →
          </Link>
        </div>
      ) : (
        <div className="mt-2.5 overflow-hidden rounded-2xl bg-white">
          {activities.map((activity, i) => {
            const { icon: Icon, bg, color } = ACTIVITY_ICONS[activity.type];
            return (
              <div
                key={activity.id}
                className={
                  i < activities.length - 1
                    ? "flex items-center gap-3 border-b-[0.5px] border-surface px-3.5 py-3"
                    : "flex items-center gap-3 px-3.5 py-3"
                }
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: bg }}
                >
                  <Icon className="size-4" style={{ color }} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-ink">{activity.title}</p>
                  {activity.subtitle && (
                    <p className="truncate text-[10px] text-ink-muted">{activity.subtitle}</p>
                  )}
                </div>
                <span className="shrink-0 text-[10px] text-ink-faint">
                  {formatRelativeTime(activity.createdAt)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
