import { Droplet } from "lucide-react";
import { formatDate } from "@/lib/formatters";

export interface DonationView {
  id: string;
  facility: string;
  donatedAt: Date | string;
  verified: boolean;
}

export function DonationItem({ donation, number }: { donation: DonationView; number: number }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 lg:px-6 lg:py-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F0FDF4]">
        <Droplet className="size-5 text-[#166534]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-body-sm font-semibold text-ink">{donation.facility}</p>
        <p className="truncate text-caption text-ink-muted">
          {formatDate(donation.donatedAt)} · {donation.verified ? "confirmed by hospital" : "self-reported"}
        </p>
      </div>
      <span className="shrink-0 text-caption font-bold text-red">#{number}</span>
    </div>
  );
}
