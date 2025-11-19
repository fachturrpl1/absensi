import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Settings, Loader2 } from "lucide-react";

export default function LeaveTypesLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-8 w-[240px]" />
              <Skeleton className="h-4 w-[320px]" />
            </div>
          </div>
        </div>
        <Skeleton className="h-9 w-[80px]" />
      </div>

      {/* Alert Skeleton */}
      <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
        <div className="flex items-start gap-3">
          <Skeleton className="h-4 w-4 mt-1" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-[180px]" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>

      {/* Statistics Skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <div className="p-2 bg-muted rounded-lg">
                  <Skeleton className="h-4 w-4" />
                </div>
              </div>
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-6 w-20 mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-6 w-[200px]" />
              </div>
              <Skeleton className="h-4 w-[280px]" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
          <Separator className="mt-4" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            ))}
          </div>

          {/* Loading Overlay */}
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading leave types...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
