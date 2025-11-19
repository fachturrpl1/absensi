import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LeaveTypesLoading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Alert Skeleton */}
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>

      {/* Main Content Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>

      {/* Statistics Skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
