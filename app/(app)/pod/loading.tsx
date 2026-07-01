import { Skeleton } from "@/components/ui/Skeleton";

export default function PodLoading() {
  return (
    <div>
      <div className="border-b-[0.5px] border-[#E5E5EA] bg-white px-4 py-4 lg:border-b-0 lg:px-6 lg:py-6">
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-9 rounded-xl lg:size-12" />
          <div className="flex-1">
            <Skeleton className="h-3.5 w-28 lg:h-4.5 lg:w-40" />
            <Skeleton className="mt-1.5 h-2 w-36 lg:w-48" />
          </div>
          <Skeleton className="size-8 rounded-full lg:size-9" />
        </div>

        <div className="mt-3.5 grid grid-cols-3 gap-2 lg:mt-5 lg:gap-3">
          <Skeleton className="h-13 rounded-xl lg:h-16" />
          <Skeleton className="h-13 rounded-xl lg:h-16" />
          <Skeleton className="h-13 rounded-xl lg:h-16" />
        </div>
      </div>

      <div className="bg-white px-4 py-3.5 lg:px-6 lg:py-4">
        <Skeleton className="h-2 w-24" />
        <div className="mt-2 flex gap-1.5 lg:gap-2">
          <Skeleton className="h-6 w-12 rounded-full lg:h-7 lg:w-14" />
          <Skeleton className="h-6 w-12 rounded-full lg:h-7 lg:w-14" />
          <Skeleton className="h-6 w-12 rounded-full lg:h-7 lg:w-14" />
          <Skeleton className="h-6 w-14 rounded-full lg:h-7 lg:w-16" />
        </div>
      </div>

      <div className="mt-2 bg-white px-4 pb-2 pt-3 lg:px-6 lg:pb-3 lg:pt-4">
        <Skeleton className="h-3.5 w-20" />
        <div className="mt-3 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-7 rounded-full lg:size-9" />
              <div className="flex-1">
                <Skeleton className="h-2.5 w-24" />
                <Skeleton className="mt-1.5 h-2 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
