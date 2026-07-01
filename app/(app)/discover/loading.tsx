import { Skeleton } from "@/components/ui/Skeleton";

function CarouselSkeleton({ cardWidth, lgCardWidth }: { cardWidth: string; lgCardWidth: string }) {
  return (
    <div className="bg-white py-3 lg:py-4">
      <Skeleton className="ml-4 h-3.5 w-24 lg:ml-6" />
      <div className="mt-2.5 flex gap-2.5 overflow-hidden px-4 lg:gap-3.5 lg:px-6">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className={`h-28 shrink-0 rounded-2xl lg:h-36 ${cardWidth} ${lgCardWidth}`} />
        ))}
      </div>
    </div>
  );
}

export default function DiscoverLoading() {
  return (
    <div>
      <div className="border-b-[0.5px] border-[#E5E5EA] bg-white px-4 py-3.5 lg:px-6 lg:py-5">
        <Skeleton className="h-3.5 w-20 lg:h-4.5 lg:w-28" />
        <Skeleton className="mt-1.5 h-2 w-32 lg:w-40" />
      </div>

      <CarouselSkeleton cardWidth="w-[230px]" lgCardWidth="lg:w-[280px]" />
      <CarouselSkeleton cardWidth="w-[104px]" lgCardWidth="lg:w-[136px]" />
      <CarouselSkeleton cardWidth="w-[150px]" lgCardWidth="lg:w-[190px]" />

      <div className="h-2 bg-surface" />

      <div className="px-4 py-3 lg:px-6 lg:py-5">
        <Skeleton className="h-9 rounded-full" />
        <div className="mt-2.5 flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:gap-3">
          <Skeleton className="h-17 rounded-2xl" />
          <Skeleton className="h-17 rounded-2xl" />
          <Skeleton className="h-17 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
