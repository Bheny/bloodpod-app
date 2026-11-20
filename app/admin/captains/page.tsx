import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { longDate } from "@/lib/admin/format";
import { CAPTAIN, titleFor } from "@/lib/captain-config";
import { isCaptainEnabled } from "@/lib/captain/flag";
import { lapseStage } from "@/lib/captain/lapse";
import { Badge, EmptyState, PageTitle, Panel } from "@/components/admin/ui";
import { CaptainOverride, CaptainSwitch } from "@/components/admin/CaptainTools";
import { CaptainReview } from "@/components/admin/CaptainReview";

interface Evidence {
  drillPassed?: boolean;
  qualifyingChildren?: number;
  uniqueDonorsInTree?: number;
  children?: { podId: string; qualifying: boolean; reason: string; level: number | null }[];
}
interface Flag {
  code: string;
  detail: string;
}

const REASON: Record<string, string> = {
  ok: "Working",
  needs_members: "Needs more verified people",
  needs_activity: "No recent answer",
  same_person: "Same person as the leader above",
};
const FLAG_LABEL: Record<string, string> = {
  same_phone: "Same phone number",
  phone_pattern: "Neighbouring numbers",
  created_fast: "Started very soon after",
  burst_joins: "Many joined at once",
};

export default async function AdminCaptainsPage() {
  await requireAdmin();
  const enabled = await isCaptainEnabled();

  const switchPanel = (
    <Panel
      title="Captain programme"
      subtitle={
        enabled
          ? "On. Captain pages, drills, badges and the nightly job are running."
          : "Off. Nothing Captain-related shows or runs, and Pods behave exactly as before."
      }
      actions={<CaptainSwitch enabled={enabled} />}
    >
      <p className="text-caption text-ink-muted">
        Recognition only: nothing is paid for any level. A leader sees a badge only after accepting the pledge.
      </p>
    </Panel>
  );

  if (!enabled) {
    return (
      <div>
        <PageTitle title="Captains" subtitle="Review promotions and keep an eye on lapsing badges." />
        {switchPanel}
      </div>
    );
  }

  const [pending, lapsing, audit] = await Promise.all([
    prisma.captainPromotion.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, take: 50 }),
    prisma.captainStatus.findMany({ where: { lapseStartedAt: { not: null }, lapsedAt: null }, orderBy: { lapseStartedAt: "asc" }, take: 50 }),
    prisma.captainAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
  ]);

  const ids = [...new Set([...pending.map((p) => p.userId), ...lapsing.map((l) => l.userId), ...audit.map((a) => a.userId)])];
  const people = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, email: true } });
  const who = new Map(people.map((p) => [p.id, p]));
  const label = (id: string) => who.get(id)?.name ?? who.get(id)?.email ?? "Someone";

  return (
    <div className="space-y-6">
      <PageTitle title="Captains" subtitle="Review promotions and keep an eye on lapsing badges." />
      {switchPanel}

      <Panel title="Waiting for review" subtitle="Level 1 approves itself unless something was flagged. Every other level waits here.">
        {pending.length === 0 ? (
          <EmptyState title="Nothing waiting" body="Promotions appear here when a leader's Pod reaches a new level." />
        ) : (
          <div className="space-y-4">
            {pending.map((p) => {
              const ev = p.evidence as Evidence;
              const flags = (p.flags ?? []) as unknown as Flag[];
              return (
                <div key={p.id} className="rounded-2xl border-[0.5px] border-hairline p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-body-sm font-bold text-ink">
                        {label(p.userId)} <span className="font-normal text-ink-muted">to</span> {titleFor(p.toLevel)}
                      </p>
                      <p className="text-caption text-ink-muted">
                        {who.get(p.userId)?.email} · asked {longDate(p.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {flags.length === 0 ? <Badge tone="green">No flags</Badge> : flags.map((f, i) => <Badge key={i} tone="amber">{FLAG_LABEL[f.code] ?? f.code}</Badge>)}
                    </div>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-2 text-caption md:grid-cols-4">
                    <div className="rounded-xl bg-surface px-3 py-2">
                      <dt className="text-ink-muted">Drill</dt>
                      <dd className="font-bold text-ink">{ev.drillPassed ? "Passed" : "Not passed"}</dd>
                    </div>
                    <div className="rounded-xl bg-surface px-3 py-2">
                      <dt className="text-ink-muted">Working child Pods</dt>
                      <dd className="font-bold text-ink">{ev.qualifyingChildren ?? 0}</dd>
                    </div>
                    <div className="rounded-xl bg-surface px-3 py-2">
                      <dt className="text-ink-muted">People in the tree</dt>
                      <dd className="font-bold text-ink">{ev.uniqueDonorsInTree ?? 0}</dd>
                    </div>
                    <div className="rounded-xl bg-surface px-3 py-2">
                      <dt className="text-ink-muted">Child Pods</dt>
                      <dd className="font-bold text-ink">{ev.children?.length ?? 0}</dd>
                    </div>
                  </dl>

                  {ev.children && ev.children.length > 0 && (
                    <ul className="mt-3 space-y-1 text-caption text-ink-mid">
                      {ev.children.map((c) => (
                        <li key={c.podId} className="flex flex-wrap justify-between gap-2">
                          <span className="truncate">Pod {c.podId.slice(-6)}</span>
                          <span>
                            {REASON[c.reason] ?? c.reason}
                            {c.level !== null ? ` · level ${c.level}` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {flags.length > 0 && (
                    <ul className="mt-3 space-y-1 rounded-xl bg-warn-soft px-3 py-2 text-caption text-warn-strong">
                      {flags.map((f, i) => (
                        <li key={i}>{f.detail}</li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-4">
                    <CaptainReview id={p.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="Lapsing" subtitle={`Badges whose requirements are no longer met. They keep the badge for ${CAPTAIN.lapseGraceDays} days.`}>
        {lapsing.length === 0 ? (
          <EmptyState title="No one is lapsing" />
        ) : (
          <ul className="divide-y-[0.5px] divide-hairline">
            {lapsing.map((l) => {
              const s = lapseStage(l.lapseStartedAt);
              return (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="text-body-sm font-semibold text-ink">{label(l.userId)}</p>
                    <p className="text-caption text-ink-muted">
                      {l.approvedLevel !== null ? titleFor(l.approvedLevel) : "Pod Starter"} · since {longDate(l.lapseStartedAt!)}
                    </p>
                  </div>
                  <Badge tone={s.stage === "warn" ? "amber" : "gray"}>{s.daysLeft} days left</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel title="Manual override" subtitle="Set or clear someone's badge by hand. It needs a reason and goes in the audit log.">
        <CaptainOverride />
      </Panel>

      <Panel title="Audit log" subtitle="Every decision and override, newest first.">
        {audit.length === 0 ? (
          <EmptyState title="Nothing yet" />
        ) : (
          <ul className="divide-y-[0.5px] divide-hairline">
            {audit.map((a) => (
              <li key={a.id} className="py-3 text-caption text-ink-mid">
                <p>
                  <span className="font-bold text-ink">{a.actorEmail}</span> {a.action} for {label(a.userId)}
                  {a.toLevel !== null ? `, level ${a.toLevel}` : ""} · {longDate(a.createdAt)}
                </p>
                <p className="text-ink-muted">{a.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
