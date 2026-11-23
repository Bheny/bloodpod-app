import { Skeleton } from "@/components/ui/Skeleton";

export default function CareLoading() {
  return (
    <div className="flex flex-col gap-3.5 px-3.5 pt-6 lg:max-w-xl lg:px-0">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-40 w-full rounded-3xl" />
      <Skeleton className="h-52 w-full rounded-3xl" />
    </div>
  );
}
