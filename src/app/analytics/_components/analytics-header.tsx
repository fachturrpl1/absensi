"use client"

import { Card } from "@/components/ui/card"
import { format } from "date-fns"

export function AnalyticsHeader() {
  const today = format(new Date(), "EEEE, MMMM dd, yyyy")

  return (
    <Card className="border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center justify-between p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {today}
          </p>
        </div>
      </div>
    </Card>
  )
}
