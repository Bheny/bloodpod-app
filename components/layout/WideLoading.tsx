import { Skeleton } from "@/components/ui/Skeleton";

// Placeholder for the two-column pages (Pod, Blood Card, Discover, Feed).
export function WideLoading() {
  return (
    <div>
      <div className="border-b-[0.5px] border-hairline bg-white px-4 py-3.5 lg:border-0 lg:bg-transparent lg:px-0 lg:pb-6 lg:pt-0">
        <Skeleton className="h-6 w-44 lg:h-8 lg:w-64" />
        <Skeleton className="mt-2 h-3 w-56" />
      </div>
      <div className="flex flex-col gap-3.5 px-3.5 py-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 lg:px-0 lg:py-0">
        <div className="flex flex-col gap-3.5 lg:gap-6">
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
        <div className="flex flex-col gap-3.5 lg:gap-6">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
