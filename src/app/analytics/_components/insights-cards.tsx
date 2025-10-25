"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface InsightData {
  type: "success" | "warning" | "info" | "positive" | "negative"
  title: string
  description: string
  value?: string
}

interface InsightsCardsProps {
  data: InsightData[]
  loading?: boolean
}

export function InsightsCards({ data, loading }: InsightsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5" />
      case "warning":
        return <AlertTriangle className="h-5 w-5" />
      case "positive":
        return <TrendingUp className="h-5 w-5" />
      case "negative":
        return <TrendingDown className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  const getColors = (type: string) => {
    switch (type) {
      case "success":
        return {
          icon: "text-green-600 dark:text-green-400",
          bg: "bg-green-50 dark:bg-green-950/30",
          border: "border-green-500/20",
        }
      case "warning":
        return {
          icon: "text-orange-600 dark:text-orange-400",
          bg: "bg-orange-50 dark:bg-orange-950/30",
          border: "border-orange-500/20",
        }
      case "positive":
        return {
          icon: "text-blue-600 dark:text-blue-400",
          bg: "bg-blue-50 dark:bg-blue-950/30",
          border: "border-blue-500/20",
        }
      case "negative":
        return {
          icon: "text-red-600 dark:text-red-400",
          bg: "bg-red-50 dark:bg-red-950/30",
          border: "border-red-500/20",
        }
      default:
        return {
          icon: "text-muted-foreground",
          bg: "bg-muted/50",
          border: "border-border",
        }
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {data.map((insight, index) => {
        const colors = getColors(insight.type)
        return (
          <Card key={index} className={cn("border-2 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]", colors.border)}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={cn("p-2.5 rounded-xl shadow-sm", colors.bg)}>
                  {getIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold mb-1">{insight.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {insight.description}
                  </p>
                  {insight.value && (
                    <p className={cn("text-lg font-bold mt-2", colors.icon)}>
                      {insight.value}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
