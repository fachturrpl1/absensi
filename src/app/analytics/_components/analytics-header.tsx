"use client"

import { Card } from "@/components/ui/card"
import { format } from "date-fns"

export function AnalyticsHeader() {
  const today = format(new Date(), "EEEE, MMMM dd, yyyy")

  return (
    <Card className="border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100">
      <div className="flex items-center justify-between p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {today}
          </p>
        </div>
      </div>
    </Card>
  )
}
