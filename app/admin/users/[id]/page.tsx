import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Mail, Phone, X } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { getUserDetail } from "@/lib/admin/metrics";
import { longDate } from "@/lib/admin/format";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { Badge, EmptyState, Panel } from "@/components/admin/ui";
import { Card } from "@/components/ui/Card";
import { getTrust } from "@/lib/admin/reports";
import { OutreachPanel } from "@/components/admin/OutreachPanel";
import { getDonorPods } from "@/lib/admin/pod-strength";
import { PodStrengthPanel } from "@/components/admin/PodStrengthPanel";

function Check1({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={ok ? "mt-0.5 flex size-5 items-center justify-center rounded-full bg-[#1FA855]" : "mt-0.5 flex size-5 items-center justify-center rounded-full bg-hairline"}
      >
        {ok ? <Check className="size-3 text-white" /> : <X className="size-3 text-ink-muted" />}
      </span>
      <span>
        <span className="block text-body-sm font-semibold text-ink">{label}</span>
        {detail && <span className="block text-caption text-ink-muted">{detail}</span>}
      </span>
    </li>
  );
}

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const u = await getUserDetail(id);
  if (!u) notFound();
  const trust = await getTrust(id);
  const garden = await getDonorPods(id);

  return (
    <div>
      <Link href="/admin/users" className="mb-4 inline-flex items-center gap-1.5 text-body-sm font-semibold text-ink-mid hover:text-ink">
        <ArrowLeft className="size-4" /> All users
      </Link>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-6">
        <div className="flex flex-col gap-4 lg:gap-6">
          <Card className="text-center">
            <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-red-light text-2xl font-extrabold text-red-fg">
              {u.bloodType ? BLOOD_TYPE_LABELS[u.bloodType] : "?"}
            </span>
            <h1 className="mt-3 text-title-lg font-extrabold tracking-[-0.5px] text-ink">{u.name ?? "No name"}</h1>
            <p className="text-body-sm text-ink-muted">{u.city ?? "No city set"}</p>

            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {u.hospital ? <Badge tone="blue">Hospital staff</Badge> : null}
              {!u.onboardingComplete ? <Badge tone="amber">Onboarding</Badge> : u.isEligible ? <Badge tone="green">Can donate</Badge> : <Badge>Resting</Badge>}
              {u.isAvailable && <Badge tone="green">Available</Badge>}
              {trust.heldAt && <Badge tone="amber">Reach paused</Badge>}
            </div>

            <div className="mt-5 space-y-2 border-t-[0.5px] border-hairline pt-4 text-left text-body-sm">
              <a href={`mailto:${u.email}`} className="flex items-center gap-2 text-ink-mid hover:text-red-fg">
                <Mail className="size-4 text-ink-faint" /> {u.email}
              </a>
              {u.phone ? (
                <a href={`tel:${u.phone}`} className="flex items-center gap-2 text-ink-mid hover:text-red-fg">
                  <Phone className="size-4 text-ink-faint" /> {u.phone}
                </a>
              ) : (
                <p className="flex items-center gap-2 text-ink-muted">
                  <Phone className="size-4 text-ink-faint" /> No phone number
                </p>
              )}
              <p className="text-caption text-ink-muted">Joined {longDate(u.createdAt)}</p>
            </div>
          </Card>

          <Panel title="Reach out" subtitle="Open a WhatsApp chat with a kind message ready to send">
            <OutreachPanel userId={u.id} name={u.name} phone={u.phone} suggest={u.onboardingComplete ? undefined : "finish_setup"} />
            {trust.outreach.length > 0 && (
              <ul className="mt-4 space-y-1 border-t-[0.5px] border-hairline pt-3 text-caption text-ink-muted">
                {trust.outreach.map((o) => (
                  <li key={o.id}>
                    {longDate(o.createdAt)} · {o.template} · {o.adminEmail}
                  </li>
                ))}
              </ul>
            )}
            {trust.reports > 0 && (
              <p className="mt-3 text-caption text-ink-muted">
                {trust.reports} report{trust.reports === 1 ? "" : "s"} on file. <Link href="/admin/reports" className="font-bold text-red-fg">Open reports</Link>
              </p>
            )}
          </Panel>

          <Panel title="Ready to be alerted?">
            <ul className="space-y-3">
              <Check1 ok={u.onboardingComplete} label="Finished onboarding" />
              <Check1 ok={!!u.bloodType} label="Blood type set" detail={u.bloodType ? BLOOD_TYPE_LABELS[u.bloodType] : undefined} />
              <Check1 ok={!!u.phone} label="Phone number" />
              <Check1
                ok={!!u.emergencyConsentAt}
                label="Agreed to emergency alerts"
                detail={u.emergencyConsentAt ? longDate(u.emergencyConsentAt) : "Not recorded"}
              />
              <Check1
                ok={u.pushSubscriptions.length > 0}
                label="Phone alerts switched on"
                detail={u.pushSubscriptions.length ? `${u.pushSubscriptions.length} device${u.pushSubscriptions.length === 1 ? "" : "s"}` : undefined}
              />
              <Check1
                ok={u.isEligible}
                label="Eligible to donate"
                detail={!u.isEligible && u.nextEligible ? `Back on ${longDate(u.nextEligible)}` : undefined}
              />
            </ul>
          </Panel>
        </div>

        <div className="flex flex-col gap-4 lg:gap-6">
          {u.ownedPods.length > 0 && <PodStrengthPanel garden={garden} />}

          <Panel title="Pods">
            {u.ownedPods.length === 0 && u.podMemberships.length === 0 ? (
              <EmptyState title="Not in any Pod" />
            ) : (
              <ul className="divide-y-[0.5px] divide-hairline">
                {u.ownedPods.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                    <span className="text-body-sm font-semibold text-ink">{p.name}</span>
                    <span className="flex items-center gap-2 text-caption text-ink-muted">
                      {p._count.members + 1} people <Badge tone="blue">Owner</Badge>
                    </span>
                  </li>
                ))}
                {u.podMemberships.map((m) => (
                  <li key={m.pod.id} className="flex items-center justify-between gap-3 py-3">
                    <span className="text-body-sm font-semibold text-ink">{m.pod.name}</span>
                    <span className="text-caption text-ink-muted">
                      Owned by {m.pod.owner.name ?? "unknown"} · joined {longDate(m.joinedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-caption text-ink-muted">Has sent {u._count.sentInvites} invite{u._count.sentInvites === 1 ? "" : "s"}.</p>
          </Panel>

          <Panel title="Donations" subtitle={`${u._count.donations} logged in total`}>
            {u.donations.length === 0 ? (
              <EmptyState title="No donations logged" />
            ) : (
              <ul className="divide-y-[0.5px] divide-hairline">
                {u.donations.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                    <span className="min-w-0">
                      <span className="block truncate text-body-sm font-semibold text-ink">{d.facility}</span>
                      <span className="block text-caption text-ink-muted">
                        {longDate(d.donatedAt)} · {BLOOD_TYPE_LABELS[d.bloodType]}
                      </span>
                    </span>
                    <Badge tone={d.verified ? "green" : "gray"}>{d.verified ? "Confirmed" : "Self-reported"}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Devices with alerts">
            {u.pushSubscriptions.length === 0 ? (
              <EmptyState title="No devices" body="This donor will not get phone alerts until they turn them on." />
            ) : (
              <ul className="divide-y-[0.5px] divide-hairline">
                {u.pushSubscriptions.map((s) => (
                  <li key={s.id} className="py-3">
                    <p className="truncate text-body-sm text-ink">{s.userAgent ?? "Unknown device"}</p>
                    <p className="text-caption text-ink-muted">Added {longDate(s.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
