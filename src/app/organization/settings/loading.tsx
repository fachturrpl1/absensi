import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function OrganizationSettingsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="space-y-6">
        {/* Organization Status Skeleton */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start justify-between p-4 rounded-lg bg-muted/50">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-64" />
            </div>
              <Skeleton className="h-6 w-16" />
            </div>
            <Separator />
            <div className="flex items-start justify-between p-4 rounded-lg bg-muted/50">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-72" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
              </div>
            </div>
            <Separator />
            <div className="flex items-start justify-between p-4 rounded-lg bg-muted/50">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-4 w-32" />
            </div>
          </CardContent>
        </Card>

        {/* Organization Information Skeleton */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <Skeleton className="h-6 w-56 mb-2" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Logo Upload Section Skeleton */}
            <div className="flex flex-col items-start">
              <Skeleton className="h-5 w-40 mb-3" />
              <Skeleton className="w-[180px] h-[100px] rounded-lg" />
              <Skeleton className="h-9 w-32 mt-3" />
              <Skeleton className="h-4 w-64 mt-4" />
            </div>

            <Separator />

            {/* Basic Information Skeleton */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-20 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Information Skeleton */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-5 w-48" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-3.5" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-3.5" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-3.5" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Location Information Skeleton */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-5 w-48" />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-16 w-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                  </div>
              <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Regional Settings Skeleton */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button Skeleton */}
        <div className="flex justify-end gap-3 pt-4">
          <Skeleton className="h-11 w-40" />
        </div>
      </div>
    </div>
  )
}
