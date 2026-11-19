import { Skeleton } from "@/components/ui/Skeleton";

export default function AppLoading() {
  return (
    <div>
      <div className="px-4 pb-3 pt-6 lg:border-b-[0.5px] lg:border-hairline lg:bg-card lg:py-3.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-2 h-2.5 w-40" />
      </div>

      <div className="flex flex-col gap-2.5 px-4 py-4">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
      </div>
    </div>
  );
}
