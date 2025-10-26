import { Skeleton } from "@/components/ui/skeleton";

export default function LocationsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}
