"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw } from "lucide-react"
import { format } from "date-fns"

interface AnalyticsHeaderProps {
  onRefresh?: () => void
  onExport?: () => void
}

export function AnalyticsHeader({
  onRefresh,
  onExport,
}: AnalyticsHeaderProps) {
  const today = format(new Date(), "EEEE, MMMM dd, yyyy")

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50">
      <div className="flex items-center justify-between p-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {today}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="border-slate-200 dark:border-slate-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="border-slate-200 dark:border-slate-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
