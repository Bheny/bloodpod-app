import { Droplets, Gift, Timer, Users } from "lucide-react";
import { Reveal } from "@/components/landing/Reveal";
import { getLandingStats, isVisible, STAT_MINIMUMS } from "@/lib/landing-stats";

// True by design, so they are safe to show from day one.
const FACTS = [
  { icon: Users, value: "Up to 20", label: "people in a Pod" },
  { icon: Droplets, value: "All 8", label: "blood types matched" },
  { icon: Timer, value: "3 steps", label: "about 2 minutes to set up" },
  { icon: Gift, value: "Free", label: "for donors, always" },
];

export async function StatsStrip() {
  const stats = await getLandingStats();
  const isProd = process.env.NODE_ENV === "production";

  const usage = stats
    ? [
        {
          key: "people",
          value: stats.people.toLocaleString("en-GB"),
          label: stats.people === 1 ? "person on BloodPod" : "people on BloodPod",
          show: isVisible(stats.people, STAT_MINIMUMS.people),
          min: STAT_MINIMUMS.people,
          live: stats.people >= STAT_MINIMUMS.people,
        },
        {
          key: "pods",
          value: stats.pods.toLocaleString("en-GB"),
          label: stats.pods === 1 ? "Pod created" : "Pods created",
          show: isVisible(stats.pods, STAT_MINIMUMS.pods),
          min: STAT_MINIMUMS.pods,
          live: stats.pods >= STAT_MINIMUMS.pods,
        },
        {
          key: "types",
          value: `${stats.typesCovered} of 8`,
          label: "blood types with a donor ready now",
          show: isVisible(stats.typesCovered, STAT_MINIMUMS.typesCovered),
          min: STAT_MINIMUMS.typesCovered,
          live: stats.typesCovered >= STAT_MINIMUMS.typesCovered,
        },
      ].filter((s) => s.show)
    : [];

  return (
    <section className="px-4 pb-10 sm:px-6 sm:pb-12 lg:px-12">
      <Reveal>
        <div className="mx-auto max-w-[1100px] rounded-card border-[0.5px] border-hairline bg-card p-4 shadow-raised sm:p-5 lg:p-7">
          {/* 2 columns on phones, 4 across from tablet width up. Stacked icon-over-text on the
              narrowest phones so the text never gets squeezed into a sliver. */}
          <dl className="grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-x-4 sm:gap-y-6 lg:grid-cols-4">
            {FACTS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex min-w-0 flex-col items-start gap-2 min-[400px]:flex-row min-[400px]:gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-light">
                  <Icon className="size-5 text-red-fg" />
                </span>
                <div className="min-w-0">
                  <dt className="sr-only">{label}</dt>
                  <dd className="text-[22px] font-extrabold leading-none tracking-[-0.6px] text-ink">{value}</dd>
                  <p className="mt-1 text-xs leading-snug text-ink-muted">{label}</p>
                </div>
              </div>
            ))}
          </dl>

          {usage.length > 0 && (
            <div className="mt-6 border-t-[0.5px] border-hairline pt-5">
              <p className="text-label font-bold uppercase tracking-[2px] text-ink-muted">So far</p>
              {/* One slim row per number on phones (number left, label right), three cards side by side from tablet up. */}
              <dl className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-4">
                {usage.map((s) => (
                  <div
                    key={s.key}
                    className={`rounded-2xl px-4 py-3 ${s.live || isProd ? "bg-surface" : "border border-dashed border-red-mid bg-red-light/40"}`}
                  >
                    <div className="flex items-baseline gap-3 sm:block">
                      <dd className="shrink-0 text-[26px] font-extrabold leading-none tracking-[-1px] text-red-fg sm:text-[28px]">
                        {s.value}
                      </dd>
                      <dt className="min-w-0 text-xs leading-snug text-ink-mid sm:mt-1">{s.label}</dt>
                    </div>
                    {!isProd && !s.live && (
                      <p className="mt-2 text-label font-semibold text-red-fg">
                        Dev only: shows in production at {s.min} or more
                      </p>
                    )}
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}
