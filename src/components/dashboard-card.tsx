import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    label: string;
  };
  loading?: boolean;
}

export function DashboardCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = "text-blue-600",
  trend,
  loading = false
}: DashboardCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn("h-4 w-4", iconColor)} />
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {loading ? (
            <div className="h-7 w-16 bg-muted animate-pulse rounded" />
          ) : (
            <div className="text-2xl font-bold">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
          {trend && (
            <div className="flex items-center text-xs">
              <span className={cn(
                "font-medium",
                trend.value > 0 ? "text-green-600" : 
                trend.value < 0 ? "text-red-600" : 
                "text-gray-600"
              )}>
                {trend.value > 0 ? "+" : ""}{trend.value}%
              </span>
              <span className="text-muted-foreground ml-1">
                {trend.label}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}