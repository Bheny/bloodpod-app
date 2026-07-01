import { Skeleton } from "@/components/ui/Skeleton";

export default function FeedLoading() {
  return (
    <div>
      <div className="border-b-[0.5px] border-[#E5E5EA] bg-white px-4 py-3.5 lg:px-6 lg:py-5">
        <Skeleton className="h-3.5 w-16 lg:h-4.5 lg:w-20" />
        <Skeleton className="mt-1.5 h-2 w-44 lg:w-56" />
      </div>

      <div className="grid grid-cols-1 gap-3 px-3.5 py-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4 lg:px-6 lg:py-5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="overflow-hidden rounded-2xl border-[0.5px] border-[#E5E5EA]">
            <Skeleton className="h-28 rounded-none" />
            <div className="p-3.5 lg:p-4">
              <Skeleton className="h-2 w-12 rounded-full" />
              <Skeleton className="mt-2 h-3 w-full" />
              <Skeleton className="mt-1.5 h-2 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
