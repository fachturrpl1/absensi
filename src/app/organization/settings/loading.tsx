import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Building2, Phone, Clock } from "@/components/icons/lucide-exports"

export default function OrganizationSettingsLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="max-w-7xl mx-auto p-6 w-full">
        {/* Header Section Skeleton */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start">
            {/* Logo Skeleton */}
            <div className="shrink-0">
              <Skeleton className="w-20 h-20 rounded-lg" />
            </div>

            {/* Organization Info Skeleton */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              
              <Skeleton className="h-5 w-96 max-w-full" />

              {/* Invitation Code Skeleton */}
              <div className="flex items-center gap-4 mt-4">
                <Skeleton className="h-4 w-28" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-32 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section with 2 Column Layout Skeleton */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Basic Information Skeleton */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Organization name, logo, and general details
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Logo Upload Section Skeleton */}
              <div className="space-y-4">
                <Skeleton className="h-4 w-40" />
                <div className="flex items-center gap-4">
                  <Skeleton className="w-16 h-16 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Organization Name Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-3 w-64" />
              </div>

              {/* Description Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full" />
              </div>

              {/* Industry Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Contact & Location Skeleton */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Phone className="h-5 w-5 text-primary" />
                Contact & Location
              </CardTitle>
              <CardDescription>
                Contact details and address information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contact Information Skeleton */}
              <div className="space-y-4">
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

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-3.5" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>

              {/* Location Information Skeleton */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-3.5" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-16 w-full" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Regional Settings - Full Width Card Skeleton */}
        <Card className="border shadow-sm mt-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Regional Settings
            </CardTitle>
            <CardDescription>
              Timezone, and currency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
          </CardContent>
        </Card>

        {/* Save Button Skeleton */}
        <div className="flex justify-end pt-6">
          <Skeleton className="h-12 w-40" />
        </div>
      </div>
    </div>
  )
}
