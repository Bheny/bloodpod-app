import { cn } from "@/lib/utils";

function QrPlaceholder() {
  const cells = [
    1, 1, 0, 1, 1, 0, 1,
    1, 0, 1, 0, 1, 0, 1,
    1, 1, 1, 0, 0, 1, 0,
    0, 0, 1, 1, 1, 0, 1,
    1, 1, 0, 0, 1, 1, 1,
    0, 1, 1, 1, 0, 1, 0,
    1, 0, 1, 0, 1, 1, 1,
  ];
  return (
    <div className="grid size-14 grid-cols-7 gap-px rounded-md bg-white p-1.5">
      {cells.map((on, i) => (
        <div key={i} className={on ? "bg-ink" : "bg-white"} />
      ))}
    </div>
  );
}

export interface PassportCardProps {
  name?: string;
  location?: string;
  bloodType?: string;
  donationCount?: number;
  podCount?: number;
  nextEligible?: string;
  variant?: "standalone" | "embedded";
  className?: string;
}

export function PassportCard({
  name = "Kwame Owusu",
  location = "Accra, Ghana",
  bloodType = "O+",
  donationCount = 7,
  podCount = 3,
  nextEligible = "Now",
  variant = "standalone",
  className,
}: PassportCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-[360px] rounded-card border border-white/10 p-6 text-white",
        variant === "standalone" ? "bg-ink" : "bg-[#2C2C2E]",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[2px] text-white/50">
          Donation passport
        </span>
        <span className="rounded-full bg-red px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          Verified
        </span>
      </div>

      <div className="mt-6 text-[52px] font-extrabold leading-none tracking-tight text-red">
        {bloodType}
      </div>

      <div className="mt-4">
        <p className="text-base font-bold text-white">{name}</p>
        <p className="text-sm text-white/50">{location}</p>
      </div>

      <div className="mt-6 flex items-center gap-6">
        <div>
          <p className="text-lg font-extrabold text-white">{donationCount}</p>
          <p className="text-[11px] text-white/50">donations</p>
        </div>
        <div>
          <p className="text-lg font-extrabold text-white">{podCount}</p>
          <p className="text-[11px] text-white/50">pods</p>
        </div>
        <div>
          <p className="text-lg font-extrabold text-white">Active</p>
          <p className="text-[11px] text-white/50">status</p>
        </div>
      </div>

      <div className="my-6 h-px bg-white/10" />

      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] text-white/50">Next eligible</p>
          <p className="text-sm font-bold text-[#34C759]">{nextEligible}</p>
        </div>
        <QrPlaceholder />
      </div>
    </div>
  );
}
