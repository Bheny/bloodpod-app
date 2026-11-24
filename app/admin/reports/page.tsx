import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { getReportQueue } from "@/lib/admin/reports";
import { longDate } from "@/lib/admin/format";
import { REASON_LABEL } from "@/lib/report-rules";
import { Badge, EmptyState, PageTitle, Panel } from "@/components/admin/ui";
import { OutreachPanel } from "@/components/admin/OutreachPanel";
import { ReportActions } from "@/components/admin/ReportActions";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

const TEMPLATE_FOR = { FAKE_DETAILS: "real_details", ASKED_FOR_PAYMENT: "no_payment", NO_SHOW: "showing_up", HARASSMENT: "real_details", OTHER: "real_details" } as const;

export default async function AdminReportsPage() {
  await requireAdmin();
  const people = await getReportQueue();

  return (
    <div>
      <PageTitle
        title="Reports"
        subtitle="People members have reported. Look first, then talk to them kindly. Nobody is told who reported them."
      />

      {people.length === 0 ? (
        <Card>
          <EmptyState title="Nothing to review" body="When someone reports a person they met through BloodPod, it appears here." />
        </Card>
      ) : (
        <div className="flex flex-col gap-4 lg:gap-6">
          {people.map((p) => (
            <Panel
              key={p.id}
              title={p.name ?? "No name"}
              subtitle={`${p.email}${p.phone ? ` · ${p.phone}` : ""}${p.city ? ` · ${p.city}` : ""} · joined ${longDate(p.createdAt)}`}
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  {p.heldAt && <Badge tone="amber">Reach paused</Badge>}
                  <Badge tone="gray">
                    {p.reports.length} report{p.reports.length === 1 ? "" : "s"} · {p.reporters} {p.reporters === 1 ? "person" : "people"}
                  </Badge>
                  <Link href={`/admin/users/${p.id}`} className="text-caption font-bold text-red-fg">
                    Full profile
                  </Link>
                </div>
              }
            >
              {p.heldAt && p.heldReason && <p className="mb-3 text-caption text-ink-muted">{p.heldReason}</p>}

              <ul className="divide-y-[0.5px] divide-hairline">
                {p.reports.map((r) => (
                  <li key={r.id} className="py-3">
                    <p className="text-body-sm font-bold text-ink">{REASON_LABEL[r.reason]}</p>
                    {r.note && <p className="mt-0.5 text-body-sm text-ink-mid">&ldquo;{r.note}&rdquo;</p>}
                    <p className="mt-0.5 text-caption text-ink-muted">
                      Reported by {r.reporter} · {longDate(r.at)}
                    </p>
                  </li>
                ))}
              </ul>

              {p.lastContacted && (
                <p className="mt-2 text-caption text-ink-muted">
                  Last contacted {longDate(p.lastContacted.at)} by {p.lastContacted.by}.
                </p>
              )}

              <div className="mt-4 grid grid-cols-1 gap-6 border-t-[0.5px] border-hairline pt-4 lg:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-body-sm font-bold text-ink">Reach out on WhatsApp</h3>
                  <OutreachPanel userId={p.id} name={p.name} phone={p.phone} suggest={TEMPLATE_FOR[p.reports[0].reason]} />
                </div>
                <div>
                  <h3 className="mb-2 text-body-sm font-bold text-ink">Decide</h3>
                  <ReportActions userId={p.id} held={Boolean(p.heldAt)} />
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
