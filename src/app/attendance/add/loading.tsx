import { Skeleton } from "@/components/ui/skeleton"

export function LoadingAttendanceAdd() {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Add Attendance</h1>
      </div>

      <div>
        {/* Tabs Skeleton */}
        <div className="grid w-full grid-cols-2 mb-4 gap-2 bg-muted/50 p-1 rounded-lg">
          <Skeleton className="h-8 rounded-md" />
          <Skeleton className="h-8 rounded-md" />
        </div>

        {/* Form Content Skeleton (Single Mode Default) */}
        <div className="flex gap-4 h-[600px] overflow-hidden mb-2 mt-2">
          {/* Panel Kiri */}
          <div className="hidden md:flex w-[280px] shrink-0 flex-col gap-3 h-full border-r pr-2 border-border mt-2 mb-2">
            <Skeleton className="h-[38px] w-full rounded-2xl" />
            <div className="flex-1 space-y-1 mt-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panel Kanan */}
          <div className="flex-1 flex flex-col gap-3 min-w-0 h-full mt-2 pr-1">
            <Skeleton className="h-[68px] w-full rounded-xl" />
            <Skeleton className="h-[42px] w-full rounded-xl" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 shrink-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[88px] sm:h-24 w-full rounded-2xl" />
              ))}
            </div>
            <div className="flex gap-1 shrink-0 mt-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-1 flex-1 rounded-full" />
              ))}
            </div>
            <div className="mt-2 space-y-2">
              <Skeleton className="h-3 w-24 ml-1" />
              <Skeleton className="h-[72px] w-full rounded-xl" />
            </div>
          </div>
        </div>

        {/* Action Buttons Skeleton */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t mt-4">
          <Skeleton className="h-9 w-[80px] rounded-md" />
        </div>
      </div>
    </div>
  )
}

// Default export untuk Next.js loading route segment
export default LoadingAttendanceAdd