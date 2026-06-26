import { Skeleton } from "@/components/ui/Skeleton";

export default function LogDonationLoading() {
  return (
    <div>
      <div className="flex items-center gap-3 border-b-[0.5px] border-[#E5E5EA] bg-white px-4 py-3.5">
        <Skeleton className="size-[22px] rounded-full" />
        <div>
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="mt-1.5 h-2 w-40" />
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 py-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <Skeleton className="h-2 w-20" />
            <Skeleton className="mt-1.5 h-12 rounded-xl" />
          </div>
        ))}
        <Skeleton className="h-12 rounded-full" />
      </div>
    </div>
  );
}
