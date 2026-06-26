import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div>
      <div className="flex items-center justify-between border-b-[0.5px] border-[#E5E5EA] bg-white px-[18px] py-3.5">
        <div>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-2.5 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-[38px] rounded-full" />
          <Skeleton className="size-[38px] rounded-full" />
        </div>
      </div>

      <div className="flex flex-col gap-2.5 px-3.5 py-3.5">
        <Skeleton className="h-[140px] rounded-2xl bg-ink/10" />
        <Skeleton className="h-[150px] rounded-2xl" />

        <div>
          <Skeleton className="h-3.5 w-24" />
          <div className="mt-2.5 grid grid-cols-2 gap-2">
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
