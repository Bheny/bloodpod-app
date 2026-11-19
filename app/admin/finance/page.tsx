import { requireAdmin } from "@/lib/admin/auth";
import { getFinance } from "@/lib/admin/finance";
import { ghs, longDate } from "@/lib/admin/format";
import { Badge, EmptyState, HBars, PageTitle, Panel, StatCard, StatGrid } from "@/components/admin/ui";
import { compact, PairedBars } from "@/components/admin/charts";
import { AddContractForm, AddEntryForm, ContractActions, EntryActions, OpeningBalanceForm } from "@/components/admin/FinanceForms";

const CONTRACT_TONE = { ACTIVE: "green", PAUSED: "amber", ENDED: "gray" } as const;

export default async function AdminFinancePage() {
  await requireAdmin();
  const f = await getFinance();

  const empty = f.entries.length === 0 && f.contracts.length === 0 && f.openingPesewas === 0;

  return (
    <div>
      <PageTitle
        title="Finance"
        subtitle="Your own ledger. Nothing here is connected to a payment provider, so it is only as complete as what you record."
      />

      <div className="mb-6">
        <AddEntryForm hospitals={f.hospitals} />
      </div>

      {empty && (
        <div className="mb-6 rounded-2xl border border-red-mid bg-red-light/50 p-4 text-body-sm text-ink">
          <p className="font-bold">Start here</p>
          <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-ink-mid">
            <li>Enter the cash you started with, below.</li>
            <li>Record what you spend, such as hosting and tools.</li>
            <li>When a hospital signs, add its contract and record each payment.</li>
          </ol>
        </div>
      )}

      <StatGrid cols={6}>
        <StatCard label="Cash in hand" value={ghs(f.cash, { decimals: false })} tone={f.cash < 0 ? "warn" : "default"} />
        <StatCard label="Monthly revenue" value={ghs(f.mrr, { decimals: false })} hint={`${ghs(f.arr, { decimals: false })} a year`} />
        <StatCard label="Received this month" value={ghs(f.collectedThisMonth, { decimals: false })} tone={f.collectedThisMonth > 0 ? "good" : "default"} />
        <StatCard label="Spent this month" value={ghs(f.spentThisMonth, { decimals: false })} />
        <StatCard
          label="Owed to you"
          value={ghs(f.receivables, { decimals: false })}
          tone={f.overdueCount > 0 ? "warn" : "default"}
          hint={f.overdueCount > 0 ? `${f.overdueCount} over 14 days` : "invoiced, unpaid"}
        />
        <StatCard
          label="Runway"
          value={f.runwayMonths === null ? (f.netBurn <= 0 ? "Self-funding" : "No cash") : `${f.runwayMonths} mo`}
          tone={f.runwayMonths !== null && f.runwayMonths < 3 ? "warn" : "default"}
          hint={f.netBurn > 0 ? `${ghs(f.netBurn, { decimals: false })} net burn a month` : "income covers spending"}
        />
      </StatGrid>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr] lg:gap-6">
        <Panel title="Money in and out" subtitle="Last 6 months, received and paid only.">
          <PairedBars
            data={f.months.map((m) => ({ label: m.label, a: m.income, b: m.expense }))}
            aLabel="Received"
            bLabel="Spent"
            format={(n) => ghs(n, { decimals: false })}
            axisFormat={(n) => compact(n / 100)}
          />
        </Panel>

        <div className="flex flex-col gap-4 lg:gap-6">
          <Panel title="Revenue by hospital" subtitle="All time, received.">
            {f.revenueByHospital.length === 0 ? (
              <EmptyState title="No revenue yet" />
            ) : (
              <HBars color="#1FA855" rows={f.revenueByHospital.map((r) => ({ label: r.name, value: r.value }))} formatValue={(n) => ghs(n, { decimals: false })} />
            )}
          </Panel>
          <Panel title="Where money goes" subtitle="Spending in the last 90 days.">
            {f.expenseByCategory.length === 0 ? (
              <EmptyState title="No spending recorded" />
            ) : (
              <HBars color="#1C1C1E" rows={f.expenseByCategory.map((r) => ({ label: r.name, value: r.value }))} formatValue={(n) => ghs(n, { decimals: false })} />
            )}
          </Panel>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <Panel title="Contracts" subtitle="Active contracts add up to your monthly revenue.">
          <div className="mb-4">
            <AddContractForm hospitals={f.hospitals} />
          </div>
          {f.contracts.length === 0 ? (
            <EmptyState title="No contracts yet" body="Add one when a hospital agrees to pay." />
          ) : (
            <ul className="divide-y-[0.5px] divide-hairline">
              {f.contracts.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-body-sm font-semibold text-ink">{c.hospital.name}</span>
                    <span className="block text-caption text-ink-muted">
                      {ghs(c.monthlyPesewas, { decimals: false })} a month · from {longDate(c.startsAt)}
                      {c.notes ? ` · ${c.notes}` : ""}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Badge tone={CONTRACT_TONE[c.status]}>{c.status.toLowerCase()}</Badge>
                    <ContractActions id={c.id} status={c.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Starting cash" subtitle="The balance before your first recorded entry. Used for cash in hand and runway.">
          <OpeningBalanceForm current={f.openingPesewas ? String(f.openingPesewas / 100) : ""} />
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Ledger" subtitle="Latest 40 entries.">
          {f.entries.length === 0 ? (
            <EmptyState title="Nothing recorded yet" />
          ) : (
            <ul className="divide-y-[0.5px] divide-hairline">
              {f.entries.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                  <span className="w-20 shrink-0 text-caption text-ink-muted">{longDate(e.date)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body-sm font-semibold text-ink">
                      {e.category}
                      {e.hospital ? <span className="font-normal text-ink-muted"> · {e.hospital.name}</span> : null}
                    </span>
                    {(e.description || e.invoiceNo) && (
                      <span className="block truncate text-caption text-ink-muted">
                        {[e.invoiceNo, e.description].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </span>
                  {e.status === "PENDING" && <Badge tone="amber">{e.type === "INCOME" ? "Unpaid" : "Owed"}</Badge>}
                  <span className={e.type === "INCOME" ? "w-28 shrink-0 text-right text-body-sm font-extrabold tabular-nums text-success-strong" : "w-28 shrink-0 text-right text-body-sm font-extrabold tabular-nums text-ink"}>
                    {e.type === "INCOME" ? "+" : "-"}
                    {ghs(e.amountPesewas)}
                  </span>
                  <EntryActions id={e.id} status={e.status} type={e.type} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
