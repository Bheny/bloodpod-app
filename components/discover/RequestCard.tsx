import { Phone } from "lucide-react";
import { BloodTypeBadge } from "@/components/ui/BloodTypeBadge";
import { RequestActions } from "@/components/discover/RequestActions";
import { formatRelativeTime } from "@/lib/formatters";
import type { RequestRow } from "@/lib/donor-requests";

const STATUS: Record<RequestRow["status"], { label: string; tone: string }> = {
  PENDING: { label: "Waiting for an answer", tone: "bg-warn-soft text-warn-strong" },
  ACCEPTED: { label: "Said yes", tone: "bg-success-soft text-success-strong" },
  DECLINED: { label: "Not available", tone: "bg-surface text-ink-mid" },
  EXPIRED: { label: "No answer", tone: "bg-surface text-ink-mid" },
  CANCELLED: { label: "Taken back", tone: "bg-surface text-ink-mid" },
};

/**
 * One request, seen from either side. Until the donor says yes, the other person is a first name.
 * After, both see the full name and phone number, because that is what the donor agreed to share.
 */
export function RequestCard({ row, role }: { row: RequestRow; role: "donor" | "seeker" }) {
  const status = STATUS[row.status];
  const other = row.other;
  const revealed = "fullName" in other;
  const display = revealed ? other.fullName ?? other.firstName : other.firstName;
  const phone = revealed ? other.phone : null;

  return (
    <div className="rounded-3xl border-[0.5px] border-hairline bg-card p-4 shadow-raised lg:rounded-2xl">
      <div className="flex items-start gap-3">
        <BloodTypeBadge bloodType={row.otherBloodType} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-sm font-bold text-ink">{display ?? "A BloodPod member"}</p>
          <p className="truncate text-caption text-ink-muted">
            {[row.otherCity, role === "donor" ? "asking for your help" : "you asked"].filter(Boolean).join(" · ")}
            {" · "}
            <span suppressHydrationWarning>{formatRelativeTime(row.createdAt)}</span>
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-label font-bold ${status.tone}`}>{status.label}</span>
      </div>

      {row.message && <p className="mt-3 rounded-2xl bg-surface px-3 py-2.5 text-body-sm text-ink-mid">&ldquo;{row.message}&rdquo;</p>}

      {row.status === "ACCEPTED" && (
        <div className="mt-3 rounded-2xl bg-success-soft px-3 py-3">
          <p className="text-caption font-semibold text-success-strong">Shared with you</p>
          {phone ? (
            <a href={`tel:${phone}`} className="mt-1 flex min-h-11 items-center gap-2 text-body-sm font-bold text-ink">
              <Phone className="size-4" aria-hidden /> {phone}
            </a>
          ) : (
            <p className="mt-1 text-caption text-ink-mid">No phone number on their profile yet.</p>
          )}
        </div>
      )}

      {row.status === "PENDING" && (
        <div className="mt-3">
          <RequestActions id={row.id} role={role} firstName={row.other.firstName} />
        </div>
      )}
    </div>
  );
}
