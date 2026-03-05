import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="ml-5 mt-5 space-y-6"> {/* ✅ MAIN WRAPPER MATCH page.tsx */}
      
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64 md:w-80 lg:w-96" />
          <Skeleton className="h-4 w-72 md:w-96" />
        </div>
        <Skeleton className="h-10 w-48 md:w-56" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-9 w-20 md:w-24" />
                </div>
                <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid Skeleton - RESPONSIVE! */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Area Chart (span 4 kolom di LG) */}
        <Card className="lg:col-span-4 border-border bg-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-6 w-40 md:w-48" />
                <Skeleton className="h-4 w-56 md:w-64" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] md:h-[300px] w-full">
              <Skeleton className="w-full h-full rounded-lg" />
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart (span 3 kolom di LG) */}
        <Card className="lg:col-span-3 border-border bg-card">
          <CardHeader className="pb-4">
            <Skeleton className="h-6 w-36 md:w-40" />
            <Skeleton className="h-4 w-40 md:w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="w-4/5 h-40 md:h-48 mx-auto rounded-full" />
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-3 h-3 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-4 w-10" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Grid Skeleton - RESPONSIVE! */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="border-border bg-card h-[400px]">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-1.5">
                  <Skeleton className="h-6 w-32 md:w-40" />
                  <Skeleton className="h-4 w-48 md:w-56" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-80px)] overflow-hidden">
              <div className="p-4 space-y-3 max-h-full overflow-y-auto">
                {[...Array(6)].map((_, j) => (
                  <div key={j} className="flex items-center gap-3 py-2">
                    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
