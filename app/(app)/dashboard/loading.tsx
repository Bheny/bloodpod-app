import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div>
      <div className="flex items-center justify-between border-b-[0.5px] border-[#E5E5EA] bg-white px-4.5 py-3.5 lg:px-6 lg:py-5">
        <div>
          <Skeleton className="h-5 w-40 lg:h-6 lg:w-56" />
          <Skeleton className="mt-2 h-2.5 w-32 lg:w-44" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-9.5 rounded-full lg:size-11" />
          <Skeleton className="size-9.5 rounded-full lg:size-11" />
        </div>
      </div>

      <div className="flex flex-col gap-2.5 px-3.5 py-3.5 lg:gap-4 lg:px-6 lg:py-6">
        <Skeleton className="h-35 rounded-2xl bg-ink/10 lg:h-42.5" />
        <Skeleton className="h-37.5 rounded-2xl lg:h-47.5" />

        <div>
          <Skeleton className="h-3.5 w-24" />
          <div className="mt-2.5 grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
            <Skeleton className="h-[88px] rounded-2xl" />
            <Skeleton className="h-[88px] rounded-2xl" />
            <Skeleton className="h-[88px] rounded-2xl" />
            <Skeleton className="h-[88px] rounded-2xl" />
          </div>
        </div>

        <div>
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="mt-2.5 h-[180px] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
