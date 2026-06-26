import Link from "next/link";
import { DonationItem, type DonationView } from "@/components/passport/DonationItem";

export function DonationHistory({
  donations,
  totalCount,
  limit,
  showSeeAll = true,
}: {
  donations: DonationView[];
  totalCount: number;
  limit?: number;
  showSeeAll?: boolean;
}) {
  const visible = limit ? donations.slice(0, limit) : donations;

  return (
    <div className="mx-2.5 mt-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-bold text-ink">Recent donations</p>
        {showSeeAll && (
          <Link href="/passport/history" className="text-xs font-bold text-red">
            See all
          </Link>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="mt-2.5 rounded-2xl bg-white p-6 text-center">
          <p className="text-sm font-bold text-ink">No donations logged yet.</p>
          <p className="mt-1 text-xs text-ink-muted">
            Log your first donation to activate your verified status.
          </p>
          <Link href="/passport/log" className="mt-2 inline-block text-sm font-bold text-red">
            Log a donation →
          </Link>
        </div>
      ) : (
        <div className="mt-2.5 divide-y-[0.5px] divide-surface overflow-hidden rounded-2xl bg-white">
          {visible.map((donation, i) => (
            <DonationItem key={donation.id} donation={donation} number={totalCount - i} />
          ))}
        </div>
      )}
    </div>
  );
}
