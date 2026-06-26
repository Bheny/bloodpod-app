import { Skeleton } from "@/components/ui/Skeleton";

function CarouselSkeleton({ cardWidth }: { cardWidth: string }) {
  return (
    <div className="bg-white py-3">
      <Skeleton className="ml-4 h-3.5 w-24" />
      <div className="mt-2.5 flex gap-2.5 overflow-hidden px-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className={`h-28 shrink-0 rounded-2xl ${cardWidth}`} />
        ))}
      </div>
    </div>
  );
}

export default function DiscoverLoading() {
  return (
    <div>
      <div className="border-b-[0.5px] border-[#E5E5EA] bg-white px-4 py-3.5">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="mt-1.5 h-2 w-32" />
      </div>

      <CarouselSkeleton cardWidth="w-[230px]" />
      <CarouselSkeleton cardWidth="w-[104px]" />
      <CarouselSkeleton cardWidth="w-[150px]" />

      <div className="h-2 bg-surface" />

      <div className="px-4 py-3">
        <Skeleton className="h-9 rounded-full" />
        <div className="mt-2.5 flex flex-col gap-2">
          <Skeleton className="h-[68px] rounded-2xl" />
          <Skeleton className="h-[68px] rounded-2xl" />
          <Skeleton className="h-[68px] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
