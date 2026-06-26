import { Skeleton } from "@/components/ui/Skeleton";

export default function DonationHistoryLoading() {
  return (
    <div>
      <div className="flex items-center gap-3 border-b-[0.5px] border-[#E5E5EA] bg-white px-4 py-3.5">
        <Skeleton className="size-[22px] rounded-full" />
        <div>
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="mt-1.5 h-2 w-28" />
        </div>
      </div>

      <div className="m-3.5 divide-y-[0.5px] divide-surface overflow-hidden rounded-2xl bg-white">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 px-3.5 py-3">
            <Skeleton className="size-8 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-2.5 w-32" />
              <Skeleton className="mt-1.5 h-2 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
