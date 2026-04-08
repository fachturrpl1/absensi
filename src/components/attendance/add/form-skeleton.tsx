import { Skeleton } from "@/components/ui/skeleton"

interface FormSkeletonProps {
  mode?: "single" | "batch"
}

export function FormSkeleton({ mode = "single" }: FormSkeletonProps) {
  if (mode === "single") {
    return (
      <div className="flex gap-4 h-[600px] overflow-hidden mb-2 mt-2">
        {/* Panel Kiri: List Member */}
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

        {/* Panel Kanan: Form */}
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
    )
  }

  // SKELETON BATCH MODE
  return (
    <div className="flex flex-col gap-3 mt-2">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-8 w-[160px] rounded-xl" />
        <Skeleton className="h-8 w-[140px] rounded-xl" />
      </div>
      <Skeleton className="h-[14px] w-[300px]" />

      <div className="flex gap-4 h-[520px] overflow-hidden">
        {/* Panel Kiri */}
        <div className="hidden md:flex w-[260px] shrink-0 flex-col h-full border-r pr-3 gap-2">
          <Skeleton className="h-[34px] w-full rounded-xl" />
          <Skeleton className="h-[32px] w-full rounded-xl" />
          <Skeleton className="h-[28px] w-full rounded-xl" />
          <div className="flex-1 space-y-1 mt-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2">
                <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel Kanan */}
        <div className="flex-1 flex flex-col gap-2 min-w-0 h-full">
          <Skeleton className="h-8 w-full rounded-xl shrink-0" />
          <div className="flex-1 space-y-3 mt-2 pr-1">
            <Skeleton className="h-4 w-32 mb-1" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[52px] w-full rounded-xl" />
            ))}
          </div>
          <div className="flex items-center justify-between pt-2 border-t mt-auto shrink-0">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-[140px] rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}