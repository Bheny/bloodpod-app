import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-2 h-4 w-80" />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-6 lg:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2 lg:gap-6">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}
