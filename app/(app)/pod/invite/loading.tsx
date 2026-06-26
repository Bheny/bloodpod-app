import { Skeleton } from "@/components/ui/Skeleton";

export default function PodInviteLoading() {
  return (
    <div>
      <div className="flex items-center gap-3 border-b-[0.5px] border-[#E5E5EA] bg-white px-4 py-3.5">
        <Skeleton className="size-[22px] rounded-full" />
        <div>
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="mt-1.5 h-2 w-40" />
        </div>
      </div>

      <div className="px-4 py-4">
        <Skeleton className="h-[110px] rounded-2xl" />
        <Skeleton className="mt-2.5 h-[120px] rounded-2xl" />

        <Skeleton className="mt-5 h-2 w-20" />
        <div className="mt-2 flex flex-col gap-1.5">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
