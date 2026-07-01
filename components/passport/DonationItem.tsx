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
    <div className="flex items-center gap-3 px-3.5 py-3 lg:px-5 lg:py-4">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#F0FDF4] lg:size-10">
        <Droplet className="size-4 text-[#166534] lg:size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-semibold text-ink lg:text-[13px]">
          {donation.facility}
        </p>
        <p className="truncate text-[9px] text-ink-muted lg:text-[11px]">
          {formatDate(donation.donatedAt)} · {donation.verified ? "verified" : "pending"}
        </p>
      </div>
      <span className="shrink-0 text-[8px] font-bold text-red lg:text-[10px]">#{number}</span>
    </div>
  );
}
