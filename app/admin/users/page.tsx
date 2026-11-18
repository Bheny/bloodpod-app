import Link from "next/link";
import { BellOff, BellRing, Download, Search } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { getUsers, USER_PAGE_SIZE } from "@/lib/admin/metrics";
import { longDate } from "@/lib/admin/format";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { Badge, EmptyState, FilterTabs, PageTitle } from "@/components/admin/ui";
import { Card } from "@/components/ui/Card";

const STATUSES = [
  { id: "all", label: "Everyone" },
  { id: "active", label: "Onboarded" },
  { id: "stalled", label: "Stuck in onboarding" },
  { id: "eligible", label: "Can donate now" },
  { id: "resting", label: "Resting" },
  { id: "alertsOff", label: "Alerts off" },
];

type SP = { q?: string; blood?: string; status?: string; page?: string };

function href(sp: SP, patch: Partial<SP>) {
  const merged = { ...sp, ...patch };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) if (v && !(k === "status" && v === "all")) params.set(k, v);
  const qs = params.toString();
  return `/admin/users${qs ? `?${qs}` : ""}`;
}

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = STATUSES.some((s) => s.id === sp.status) ? sp.status! : "all";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const { rows, total, pages } = await getUsers({
    q: sp.q?.trim() || undefined,
    blood: sp.blood || undefined,
    status: status === "all" ? undefined : status,
    page,
  });

  const exportParams = new URLSearchParams();
  if (sp.q) exportParams.set("q", sp.q);
  if (sp.blood) exportParams.set("blood", sp.blood);
  if (status !== "all") exportParams.set("status", status);

  return (
    <div>
      <PageTitle
        title="Users"
        subtitle={`${total} donor${total === 1 ? "" : "s"} match`}
        actions={
          <a
            href={`/api/admin/users/export?${exportParams.toString()}`}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-body-sm font-bold text-ink shadow-raised transition-colors hover:bg-surface"
          >
            <Download className="size-4" /> Export CSV
          </a>
        }
      />

      <form method="get" action="/admin/users" className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Search name, email, phone or city"
            aria-label="Search users"
            className="w-full rounded-xl border border-hairline bg-white py-3 pl-11 pr-4 text-body-sm text-ink placeholder:text-ink-faint focus:border-red focus:outline-none focus:ring-3 focus:ring-red/8"
          />
        </div>
        <select
          name="blood"
          defaultValue={sp.blood ?? ""}
          aria-label="Blood type"
          className="rounded-xl border border-hairline bg-white px-4 py-3 text-body-sm text-ink focus:border-red focus:outline-none"
        >
          <option value="">All blood types</option>
          {Object.entries(BLOOD_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <button type="submit" className="rounded-xl bg-ink px-6 py-3 text-body-sm font-bold text-white">
          Search
        </button>
      </form>

      <div className="mt-4">
        <FilterTabs
          active={status}
          items={STATUSES.map((s) => ({ id: s.id, label: s.label, href: href(sp, { status: s.id, page: undefined }) }))}
        />
      </div>

      <Card className="mt-4 overflow-hidden p-0 lg:p-0">
        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No donors match" body="Try a different search or clear the filters." />
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[1.6fr_0.8fr_1fr_0.9fr_0.6fr_0.9fr] gap-4 border-b-[0.5px] border-hairline px-5 py-3 text-caption font-bold uppercase tracking-wide text-ink-muted lg:grid">
              <span>Donor</span>
              <span>Blood</span>
              <span>City</span>
              <span>Status</span>
              <span>Alerts</span>
              <span>Joined</span>
            </div>
            <ul className="divide-y-[0.5px] divide-hairline">
              {rows.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="grid items-center gap-x-4 gap-y-1 px-4 py-3.5 transition-colors hover:bg-surface lg:grid-cols-[1.6fr_0.8fr_1fr_0.9fr_0.6fr_0.9fr] lg:px-5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-body-sm font-bold text-ink">{u.name ?? "No name"}</span>
                      <span className="block truncate text-caption text-ink-muted">{u.email}</span>
                    </span>
                    <span className="text-body-sm font-extrabold text-ink">
                      {u.bloodType ? BLOOD_TYPE_LABELS[u.bloodType] : <span className="font-medium text-ink-faint">None</span>}
                    </span>
                    <span className="truncate text-body-sm text-ink-mid">{u.city ?? "Not set"}</span>
                    <span>
                      {!u.onboardingComplete ? (
                        <Badge tone="amber">Onboarding</Badge>
                      ) : u.isEligible ? (
                        <Badge tone="green">Can donate</Badge>
                      ) : (
                        <Badge>Resting</Badge>
                      )}
                    </span>
                    <span>
                      {u._count.pushSubscriptions > 0 ? (
                        <BellRing className="size-4 text-[#1FA855]" aria-label="Alerts on" />
                      ) : (
                        <BellOff className="size-4 text-ink-faint" aria-label="Alerts off" />
                      )}
                    </span>
                    <span className="text-caption text-ink-muted">{longDate(u.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-body-sm">
          {page > 1 ? (
            <Link href={href(sp, { page: String(page - 1) })} className="rounded-full bg-white px-4 py-2 font-bold text-ink shadow-raised">
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-ink-muted">
            Page {page} of {pages} ({USER_PAGE_SIZE} per page)
          </span>
          {page < pages ? (
            <Link href={href(sp, { page: String(page + 1) })} className="rounded-full bg-white px-4 py-2 font-bold text-ink shadow-raised">
              Next
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
