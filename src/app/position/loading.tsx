import { Skeleton } from "@/components/ui/skeleton"

export default function PositionLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 w-full p-4 md:p-6">
      <div className="w-full space-y-4 min-w-0">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex gap-3 flex-wrap">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="mt-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
