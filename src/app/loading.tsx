import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-[200px]" />
          <Skeleton className="h-5 w-[350px]" /> {/* Date/time display */}
        </div>
        <Skeleton className="h-10 w-[280px]" /> {/* Date filter bar */}
      </div>

      {/* Stats Grid Skeleton - 4 enhanced stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-9 w-[90px]" />
                </div>
                <Skeleton className="w-12 h-12 rounded-xl" />
              </div>
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-[60px]" />
                <Skeleton className="h-3 w-[80px]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Main Area Chart */}
        <Card className="lg:col-span-4 border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-[180px]" />
                </div>
                <Skeleton className="h-4 w-[280px]" />
              </div>
              <Skeleton className="h-6 w-[100px] rounded-full" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Chart area with grid lines simulation */}
              <div className="h-[300px] relative">
                <div className="absolute inset-0 flex flex-col justify-between py-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-px w-full" />
                  ))}
                </div>
                {/* Chart bars/areas */}
                <div className="absolute bottom-0 left-0 right-0 h-[200px] flex items-end justify-around px-4 gap-2">
                  {[...Array(12)].map((_, i) => (
                    <Skeleton 
                      key={i} 
                      className="flex-1" 
                      style={{ height: `${Math.random() * 60 + 40}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Pie Chart */}
        <Card className="lg:col-span-3 border-border">
          <CardHeader>
            <Skeleton className="h-5 w-[160px]" />
            <Skeleton className="h-4 w-[140px]" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center mb-4">
              <Skeleton className="h-[200px] w-[200px] rounded-full" />
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-3 h-3 rounded-full" />
                    <Skeleton className="h-4 w-[70px]" />
                  </div>
                  <Skeleton className="h-5 w-[45px]" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers Skeleton */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-[150px]" />
              </div>
              <Skeleton className="h-4 w-[300px]" />
            </div>
            <Skeleton className="h-6 w-[100px] rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col items-center p-4 rounded-lg border border-border hover:shadow-md transition-shadow">
                <div className="relative mb-3">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  {i === 0 && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full" />
                  )}
                </div>
                <Skeleton className="h-4 w-[110px] mb-2" />
                <div className="flex items-center gap-1">
                  <Skeleton className="h-3 w-3 rounded" />
                  <Skeleton className="h-4 w-[50px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline & Live Attendance Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-[140px]" />
                </div>
                <Skeleton className="h-4 w-[200px]" />
              </div>
              <Skeleton className="h-9 w-[90px]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="flex items-start gap-4 p-3 rounded-lg border border-border">
                  <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-[80px]" />
                      <Skeleton className="h-3 w-3 rounded-full" />
                      <Skeleton className="h-3 w-[60px]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Live Attendance Table */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-[180px]" />
                </div>
                <Skeleton className="h-4 w-[150px]" />
              </div>
              <Skeleton className="h-9 w-[90px]" />
            </div>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <Skeleton className="w-2 h-2 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-3 w-[60px]" />
                    <Skeleton className="h-5 w-[30px]" />
                  </div>
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[140px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                  <Skeleton className="h-6 w-[70px] rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
