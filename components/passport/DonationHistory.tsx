import Link from "next/link";
import { Droplet } from "lucide-react";
import { DonationItem, type DonationView } from "@/components/passport/DonationItem";
import { Card, CardTitle } from "@/components/ui/Card";

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
    <Card className="overflow-hidden p-0 lg:p-0">
      <div className="px-4 pt-4 lg:px-6 lg:pt-6">
        <CardTitle
          aside={
            showSeeAll && donations.length > 0 ? (
              <Link href="/passport/history" className="text-caption font-bold text-red">
                See all
              </Link>
            ) : undefined
          }
        >
          Recent donations
        </CardTitle>
      </div>

      {visible.length === 0 ? (
        <div className="px-4 py-10 text-center lg:px-6">
          <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-surface">
            <Droplet className="size-5 text-ink-faint" />
          </span>
          <p className="mt-3 text-body-sm font-bold text-ink lg:text-title">No donations logged yet</p>
          <p className="mx-auto mt-1 max-w-xs text-caption text-ink-muted lg:text-body-sm">
            Log a donation and your next eligible date updates by itself.
          </p>
          <Link
            href="/passport/log"
            className="mt-4 inline-flex rounded-full bg-red px-6 py-3 text-body-sm font-bold text-white"
          >
            Log a donation
          </Link>
        </div>
      ) : (
        <div className="mt-2 divide-y-[0.5px] divide-hairline pb-1">
          {visible.map((donation, i) => (
            <DonationItem key={donation.id} donation={donation} number={totalCount - i} />
          ))}
        </div>
      )}
    </Card>
  );
}
