import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getActivityFeed } from "@/lib/activity";
import { formatRelativeTime } from "@/lib/formatters";
import { ACTIVITY_ICONS } from "@/components/dashboard/ActivityFeed";
import { AppHeader } from "@/components/layout/AppHeader";

export default async function ActivityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const { items } = await getActivityFeed(user.id, 1, 50);

  return (
    <div>
      <AppHeader title="Activity" subtitle="Everything happening in your pod" backHref="/dashboard" />

      {items.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="text-sm font-bold text-ink">No activity yet.</p>
          <p className="mt-1 text-xs text-ink-muted">
            Invite someone to your pod to get started.
          </p>
        </div>
      ) : (
        <div className="m-3.5 divide-y-[0.5px] divide-surface overflow-hidden rounded-2xl bg-white">
          {items.map((activity) => {
            const { icon: Icon, bg, color } = ACTIVITY_ICONS[activity.type];
            return (
              <div key={activity.id} className="flex items-center gap-3 px-3.5 py-3">
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
