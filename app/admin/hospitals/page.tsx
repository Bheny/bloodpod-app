import { Mail, MapPin, Phone } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { getHospitals } from "@/lib/admin/metrics";
import { ghs, longDate } from "@/lib/admin/format";
import { Badge, EmptyState, FilterTabs, PageTitle } from "@/components/admin/ui";
import { HospitalReview } from "@/components/admin/HospitalReview";
import { Card } from "@/components/ui/Card";

const KIND = { HOSPITAL: "Hospital", BLOOD_BANK: "Blood bank", CLINIC: "Clinic" } as const;
const TONE = { PENDING: "amber", APPROVED: "green", REJECTED: "gray" } as const;
const LABEL = { PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected" } as const;

export default async function AdminHospitalsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const filter = ["PENDING", "APPROVED", "REJECTED"].includes(sp.status ?? "") ? sp.status! : "ALL";
  const { rows, tally } = await getHospitals(filter === "ALL" ? undefined : filter);

  return (
    <div>
      <PageTitle title="Hospitals" subtitle="Review applications. Nothing reaches donors until a hospital is approved." />

      <FilterTabs
        active={filter}
        items={[
          { id: "ALL", label: "All", count: tally.ALL, href: "/admin/hospitals" },
          { id: "PENDING", label: "Pending", count: tally.PENDING, href: "/admin/hospitals?status=PENDING" },
          { id: "APPROVED", label: "Approved", count: tally.APPROVED, href: "/admin/hospitals?status=APPROVED" },
          { id: "REJECTED", label: "Rejected", count: tally.REJECTED, href: "/admin/hospitals?status=REJECTED" },
        ]}
      />

      <div className="mt-4 space-y-4">
        {rows.length === 0 ? (
          <EmptyState title="No applications here" body="Applications appear when a hospital applies at /hospital/apply." />
        ) : (
          rows.map((h) => {
            const contact = h.staff[0];
            const mrr = h.contracts.reduce((s, c) => s + c.monthlyPesewas, 0);
            return (
              <Card key={h.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-title font-extrabold tracking-[-0.3px] text-ink">{h.name}</h2>
                      <Badge tone={TONE[h.status]}>{LABEL[h.status]}</Badge>
                      <Badge>{KIND[h.kind]}</Badge>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-body-sm text-ink-muted">
                      <MapPin className="size-3.5" /> {h.address}, {h.city}
                    </p>
                  </div>
                  <p className="text-caption text-ink-muted">Applied {longDate(h.createdAt)}</p>
                </div>

                <div className="mt-4 grid gap-4 border-t-[0.5px] border-hairline pt-4 md:grid-cols-2">
                  <div className="space-y-1.5 text-body-sm">
                    <p className="text-caption font-bold uppercase tracking-wide text-ink-muted">Contact</p>
                    {contact ? (
                      <>
                        <p className="font-semibold text-ink">
                          {contact.name ?? "No name"}
                          {contact.jobTitle ? <span className="font-normal text-ink-muted">, {contact.jobTitle}</span> : null}
                        </p>
                        <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-ink-mid hover:text-red-fg">
                          <Mail className="size-4 text-ink-faint" /> {contact.email}
                        </a>
                      </>
                    ) : (
                      <p className="text-ink-muted">No linked account</p>
                    )}
                    <a href={`tel:${h.phone}`} className="flex items-center gap-2 text-ink-mid hover:text-red-fg">
                      <Phone className="size-4 text-ink-faint" /> {h.phone}
                    </a>
                  </div>

                  <div className="space-y-1.5 text-body-sm">
                    <p className="text-caption font-bold uppercase tracking-wide text-ink-muted">Their note</p>
                    <p className="text-ink-mid">{h.note || "None"}</p>
                    {mrr > 0 && <p className="font-semibold text-success-strong">Pays {ghs(mrr, { decimals: false })} a month</p>}
                  </div>
                </div>

                {h.reviewedAt && (
                  <p className="mt-4 rounded-xl bg-surface px-3 py-2 text-caption text-ink-muted">
                    {LABEL[h.status]} {longDate(h.reviewedAt)}
                    {h.reviewedBy ? ` by ${h.reviewedBy}` : ""}
                    {h.reviewNote ? `. Note: ${h.reviewNote}` : ""}
                  </p>
                )}

                <div className="mt-4">
                  <HospitalReview id={h.id} status={h.status} />
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
