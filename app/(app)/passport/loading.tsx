import { Skeleton } from "@/components/ui/Skeleton";

export default function PassportLoading() {
  return (
    <div>
      <div className="border-b-[0.5px] border-[#E5E5EA] bg-white px-3.5 py-2.5 lg:px-6 lg:py-5">
        <Skeleton className="h-3.5 w-36 lg:h-4.5 lg:w-48" />
        <Skeleton className="mt-1.5 h-2 w-44 lg:w-56" />
      </div>

      <Skeleton className="mx-2.5 mt-2.5 h-57.5 rounded-2xl bg-ink/15 lg:mx-6 lg:h-72" />

      <div className="mx-2.5 mt-3 flex gap-1.5 lg:mx-6 lg:gap-2.5">
        <Skeleton className="h-15 flex-1 rounded-[10px] lg:h-20 lg:rounded-xl" />
        <Skeleton className="h-15 flex-1 rounded-[10px] lg:h-20 lg:rounded-xl" />
        <Skeleton className="h-15 flex-1 rounded-[10px] lg:h-20 lg:rounded-xl" />
      </div>

      <div className="mx-2.5 mt-3 flex gap-1.5 lg:mx-6 lg:gap-2.5">
        <Skeleton className="h-10 flex-1 rounded-full lg:h-12" />
        <Skeleton className="h-10 flex-1 rounded-full lg:h-12" />
      </div>

      <div className="mx-2.5 mt-4 lg:mx-6">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="mt-2.5 h-37.5 rounded-2xl" />
      </div>
    </div>
  );
}
