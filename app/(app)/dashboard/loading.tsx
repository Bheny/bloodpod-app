import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div>
      <div className="flex items-center justify-between px-4 pb-3 pt-6 lg:border-0 lg:bg-transparent lg:px-0 lg:pb-6 lg:pt-0">
        <div>
          <Skeleton className="h-5 w-40 lg:h-8 lg:w-64" />
          <Skeleton className="mt-2 h-2.5 w-32 lg:w-44" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="size-10 rounded-full" />
        </div>
      </div>

      <div className="flex flex-col gap-3.5 px-3.5 py-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 lg:px-0 lg:py-0">
        <div className="flex flex-col gap-3.5 lg:gap-6">
          <Skeleton className="h-24 rounded-2xl lg:h-28" />
          <div className="grid gap-3.5 lg:grid-cols-2 lg:gap-6">
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </div>
          <Skeleton className="h-48 rounded-2xl" />
        </div>
        <div className="flex flex-col gap-3.5 lg:gap-6">
          <Skeleton className="h-44 rounded-2xl bg-ink/10" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
