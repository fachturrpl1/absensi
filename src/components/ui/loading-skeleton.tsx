import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="flex gap-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-5 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <Card className="border-gray-200 dark:border-gray-700">
      <CardHeader className="space-y-3">
        <Skeleton className="h-7 w-[180px]" />
        <Skeleton className="h-5 w-[280px]" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      </CardContent>
    </Card>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-5 w-[120px]" />
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-11 w-[140px]" />
        <Skeleton className="h-11 w-[100px]" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <Skeleton className="h-5 w-[120px]" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-[80px] mb-2" />
              <Skeleton className="h-4 w-[140px]" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader>
            <Skeleton className="h-7 w-[220px] mb-2" />
            <Skeleton className="h-4 w-[180px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[320px] w-full rounded-lg" />
          </CardContent>
        </Card>
        
        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader>
            <Skeleton className="h-7 w-[200px] mb-2" />
            <Skeleton className="h-4 w-[160px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[320px] w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
      
      {/* Table */}
      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader className="space-y-3">
          <Skeleton className="h-7 w-[180px]" />
          <Skeleton className="h-4 w-[240px]" />
        </CardHeader>
        <CardContent>
          <TableSkeleton rows={5} columns={5} />
        </CardContent>
      </Card>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Avatar and Name */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
      </div>
      
      {/* Details */}
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-5 w-[150px]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 border rounded-md">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-3 w-[150px]" />
          </div>
          <Skeleton className="h-8 w-[80px]" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="w-full h-[300px] flex items-end gap-3 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end">
          <Skeleton 
            className="w-full rounded-t-lg" 
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-3">
        <Skeleton className="h-10 w-[350px]" />
        <Skeleton className="h-5 w-[550px]" />
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-3">
        <Skeleton className="h-11 w-[140px]" />
        <Skeleton className="h-11 w-[120px]" />
      </div>
      
      {/* Content */}
      <Card className="border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <TableSkeleton rows={8} columns={6} />
        </CardContent>
      </Card>
    </div>
  );
}
