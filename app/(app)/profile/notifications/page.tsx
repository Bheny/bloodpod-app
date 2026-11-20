import Link from "next/link";
import { redirect } from "next/navigation";
import { BellRing, ChevronRight, Droplet } from "lucide-react";
import type { Activity } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getActivityFeed } from "@/lib/activity";
import { getOpenEmergencies } from "@/lib/emergencies";
import { getReceivedRequests } from "@/lib/donor-requests";
import { RequestCard } from "@/components/discover/RequestCard";
import { formatRelativeTime } from "@/lib/formatters";
import { ACTIVITY_ICONS } from "@/components/dashboard/ActivityFeed";
import { AppHeader } from "@/components/layout/AppHeader";
import { PushToggle } from "@/components/pwa/PushToggle";
import { AvailabilityRow } from "@/components/profile/AvailabilityRow";
import { Card } from "@/components/ui/Card";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="px-1 text-caption font-bold uppercase tracking-wide text-ink-muted">{children}</h2>;
}

const DAY = 86_400_000;

/** Today, this week, then everything older, so a long list reads in stages. */
function group(items: Activity[]) {
  const now = Date.now();
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const buckets: { label: string; items: Activity[] }[] = [
    { label: "Today", items: [] },
    { label: "This week", items: [] },
    { label: "Earlier", items: [] },
  ];
  for (const a of items) {
    const t = new Date(a.createdAt).getTime();
    if (t >= startOfToday) buckets[0].items.push(a);
    else if (now - t < 7 * DAY) buckets[1].items.push(a);
    else buckets[2].items.push(a);
  }
  return buckets.filter((b) => b.items.length > 0);
}

const URGENCY = { CRITICAL: "Critical", URGENT: "Urgent", STANDARD: "Needed" } as const;

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.hospitalId) redirect("/hospital");
  if (user.labId) redirect("/lab");
  if (!user.onboardingComplete) redirect("/onboarding");

  const [emergencies, { items }, asks] = await Promise.all([
    getOpenEmergencies(user.id, user.bloodType),
    getActivityFeed(user.id, 1, 30),
    getReceivedRequests(user.id),
  ]);
  const groups = group(items);

  return (
    <div>
      <AppHeader title="Notifications" subtitle="Alerts for you, and what has been happening" backHref="/dashboard" />

      <div className="flex flex-col gap-6 px-3.5 pb-8 pt-3 lg:max-w-2xl lg:px-6 lg:pt-5">
        {/* People who found you on Discover and asked for help. Nothing is shared until you say yes. */}
        {asks.length > 0 && (
          <section className="flex flex-col gap-2.5" aria-label="Asking for your help">
            <SectionLabel>Asking for your help</SectionLabel>
            {asks.map((row) => (
              <RequestCard key={row.id} row={row} role="donor" />
            ))}
          </section>
        )}

        {/* What needs an answer comes first. */}
        {emergencies.length > 0 && (
          <section className="flex flex-col gap-2.5" aria-label="Needs you">
            <SectionLabel>Needs you</SectionLabel>
            {emergencies.map((e) => (
              <Link
                key={e.id}
                href="/dashboard/request"
                className="flex items-center gap-3 rounded-3xl bg-red p-4 text-white shadow-[0_14px_30px_-14px_rgba(221,0,0,0.55)] transition-transform active:scale-[0.98]"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Droplet className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-label font-bold uppercase tracking-wide text-white/80">
                    {URGENCY[e.urgency]} ·{" "}
                    <span suppressHydrationWarning>{formatRelativeTime(e.createdAt)}</span>
                  </span>
                  <span className="mt-0.5 block text-body-sm font-extrabold leading-tight">
                    {e.bloodType} needed at {e.facility}
                  </span>
                  {e.location && <span className="block truncate text-caption text-white/80">{e.location}</span>}
                </span>
                <ChevronRight className="size-5 shrink-0 text-white/80" />
              </Link>
            ))}
          </section>
        )}

        {/* Earlier */}
        {groups.length === 0 && emergencies.length === 0 && asks.length === 0 ? (
          <Card className="text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-fill">
              <BellRing className="size-6 text-ink-muted" />
            </span>
            <p className="mt-3 text-body-sm font-bold text-ink">You&apos;re all caught up</p>
            <p className="mt-1 text-caption text-ink-muted">
              {user.bloodType
                ? "When someone near you needs your blood type, it shows up here first."
                : "Add your blood type so we can tell you when it is needed."}
            </p>
          </Card>
        ) : (
          groups.map((g) => (
            <section key={g.label} className="flex flex-col gap-2.5">
              <SectionLabel>{g.label}</SectionLabel>
              <div className="divide-y-[0.5px] divide-hairline overflow-hidden rounded-3xl border-[0.5px] border-hairline bg-card shadow-raised lg:rounded-2xl">
                {g.items.map((a) => {
                  const { icon: Icon, bg, color } = ACTIVITY_ICONS[a.type];
                  return (
                    <div key={a.id} className="flex items-center gap-3 px-4 py-3.5">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: bg }}>
                        <Icon className="size-[18px]" style={{ color }} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-body-sm font-semibold leading-snug text-ink">{a.title}</p>
                        {a.subtitle && <p className="truncate text-caption text-ink-muted">{a.subtitle}</p>}
                      </div>
                      <span className="shrink-0 text-label text-ink-faint" suppressHydrationWarning>
                        {formatRelativeTime(a.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}

        {/* Settings sit last: the inbox is what people come for. */}
        <section className="flex flex-col gap-2.5" aria-label="Alert settings">
          <SectionLabel>Your alerts</SectionLabel>
          <PushToggle />
          <AvailabilityRow initiallyAvailable={user.isAvailable} />
        </section>

        <section className="flex flex-col gap-2.5" aria-label="How alerts work">
          <SectionLabel>How alerts work</SectionLabel>
          <Card>
            <ul className="space-y-3 text-caption leading-snug text-ink-mid lg:text-body-sm">
              <li className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red" />
                You are only alerted when your blood type is needed near you.
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red" />
                After you donate, you rest for 3 months and won&apos;t be alerted until you are eligible again.
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red" />
                Your name and number are shared only if you answer Yes. Say No and nothing is shared.
              </li>
            </ul>
          </Card>
        </section>
      </div>
    </div>
  );
}
