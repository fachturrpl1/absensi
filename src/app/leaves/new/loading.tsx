import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon } from "lucide-react"

export default function NewLeaveLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto w-full">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="space-y-1">
          <Skeleton className="h-9 w-[200px]" />
          <Skeleton className="h-5 w-[280px]" />
        </div>
      </div>

      {/* Form Card Skeleton */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Leave Request Form</CardTitle>
              <CardDescription className="mt-1">
                Fill in the details for your leave request. All required fields are marked with *
              </CardDescription>
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
                      <div className="space-y-1">
                        <Skeleton className="h-5 w-[120px]" />
                        <Skeleton className="h-4 w-[180px]" />
                      </div>
                    </div>
                  </div>
                ))}
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
            <Separator className="my-6" />
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 flex-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
