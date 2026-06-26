import { Skeleton } from "@/components/ui/Skeleton";

export default function PassportLoading() {
  return (
    <div>
      <div className="border-b-[0.5px] border-[#E5E5EA] bg-white px-3.5 py-2.5">
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="mt-1.5 h-2 w-44" />
      </div>

      <Skeleton className="mx-2.5 mt-2.5 h-[230px] rounded-2xl bg-ink/15" />

      <div className="mx-2.5 mt-3 flex gap-1.5">
        <Skeleton className="h-[60px] flex-1 rounded-[10px]" />
        <Skeleton className="h-[60px] flex-1 rounded-[10px]" />
        <Skeleton className="h-[60px] flex-1 rounded-[10px]" />
      </div>

      <div className="mx-2.5 mt-3 flex gap-1.5">
        <Skeleton className="h-10 flex-1 rounded-full" />
        <Skeleton className="h-10 flex-1 rounded-full" />
      </div>

      <div className="mx-2.5 mt-4">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="mt-2.5 h-[150px] rounded-2xl" />
      </div>
    </div>
  );
}
