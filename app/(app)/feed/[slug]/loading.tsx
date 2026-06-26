import { Skeleton } from "@/components/ui/Skeleton";

export default function ArticleLoading() {
  return (
    <div>
      <div className="flex items-center gap-3 border-b-[0.5px] border-[#E5E5EA] bg-white px-4 py-3.5">
        <Skeleton className="size-[22px] rounded-full" />
        <Skeleton className="h-3.5 w-16" />
      </div>

      <Skeleton className="h-32 rounded-none" />

      <div className="px-4 py-4">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="mt-2.5 h-6 w-full" />
        <Skeleton className="mt-1.5 h-2 w-32" />

        <div className="mt-4 flex flex-col gap-3">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  );
}
