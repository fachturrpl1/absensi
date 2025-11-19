import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon, Loader2 } from "lucide-react"

export default function NewLeaveLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[280px]" />
        </div>
      </div>

      {/* Progress Indicator Skeleton */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-4 w-[140px]" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </CardContent>
      </Card>

      {/* Form Card Skeleton */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-[200px]" />
              <Skeleton className="h-4 w-[320px]" />
            </div>
          </div>
          <Separator className="mt-4" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Leave Type Field */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-[100px]" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-[200px]" />
            </div>

            {/* Leave Type Info Alert */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <Skeleton className="h-4 w-4 mt-1" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              </div>
            </div>

            {/* Date Range Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-[90px]" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-4 w-[160px]" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-5 w-[80px]" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </div>
            </div>

            {/* Half Day Options */}
            <div className="space-y-4">
              <div className="space-y-3">
                <Skeleton className="h-5 w-[140px]" />
                <Skeleton className="h-4 w-[280px]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-4 w-4 mt-1" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-[120px]" />
                        <Skeleton className="h-4 w-[180px]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculated Days Alert */}
            <div className="p-4 border rounded-lg bg-blue-50">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>

            {/* Reason Field */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-[140px]" />
              <Skeleton className="h-[120px] w-full" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-[160px]" />
                <Skeleton className="h-4 w-[80px]" />
              </div>
            </div>

            {/* Emergency Contact Field */}
            <div className="space-y-3">
              <Skeleton className="h-5 w-[160px]" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-[240px]" />
            </div>

            {/* Submit Section */}
            <div className="space-y-4">
              <Separator />
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-12 flex-1" />
              </div>
            </div>
          </div>

          {/* Loading Overlay */}
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading form...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
