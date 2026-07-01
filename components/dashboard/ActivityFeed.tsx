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

// Only genuine urgency (BLOOD_REQUEST) gets color. Everything else stays monochrome
// so the one thing that actually needs attention is the only thing that stands out.
export const ACTIVITY_ICONS: Record<ActivityType, { icon: LucideIcon; bg: string; color: string }> = {
  BLOOD_REQUEST: { icon: Bell, bg: "#FFF0F0", color: "#DD0000" },
  MEMBER_JOINED: { icon: UserPlus, bg: "#F2F2F2", color: "#48484A" },
  DONATION_LOGGED: { icon: Droplet, bg: "#F2F2F2", color: "#48484A" },
  INVITE_ACCEPTED: { icon: Check, bg: "#F2F2F2", color: "#48484A" },
  HOSPITAL_VERIFIED: { icon: Hospital, bg: "#F2F2F2", color: "#48484A" },
  BADGE_EARNED: { icon: Award, bg: "#F2F2F2", color: "#48484A" },
};

export function ActivityFeed({
  activities,
  showPodName = true,
}: {
  activities: Activity[];
  showPodName?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-body-sm font-bold text-ink lg:text-title">Recent activity</p>
        <Link href="/activity" className="text-label font-bold text-ink-mid">
          See all
        </Link>
      </div>

      {activities.length === 0 ? (
        <div className="mt-2.5 rounded-2xl bg-white p-6 text-center lg:p-10">
          <p className="text-sm font-bold text-ink lg:text-base">No activity yet.</p>
          <p className="mt-1 text-xs text-ink-muted lg:text-sm">
            Invite someone to your pod to get started.
          </p>
          <Link href="/pod/invite" className="mt-2 inline-block text-sm font-bold text-red lg:text-base">
            Invite now
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
                    ? "flex items-center gap-3 border-b-[0.5px] border-hairline px-3.5 py-3 lg:px-5 lg:py-4"
                    : "flex items-center gap-3 px-3.5 py-3 lg:px-5 lg:py-4"
                }
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-xl lg:size-10"
                  style={{ backgroundColor: bg }}
                >
                  <Icon className="size-4 lg:size-5" style={{ color }} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-ink lg:text-sm">{activity.title}</p>
                  {activity.subtitle && showPodName && (
                    <p className="truncate text-label text-ink-muted">
                      {activity.subtitle}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-label text-ink-faint">
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
