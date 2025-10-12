"use client"

import type { LucideIcon } from "@/components/icons/lucide-exports"
import { Badge } from "@/components/ui/badge"

export function CustomerInsightItem({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: number
  icon: LucideIcon
  color: string
}) {
  return (
    <li className="flex gap-x-3 items-center">
      <Badge
        style={{ backgroundColor: color }}
        className="h-12 w-12 flex items-center justify-center"
        aria-hidden
      >
        <Icon className="h-6 w-6 text-white" />
      </Badge>
      <div className="overflow-hidden">
        <h4 className="text-sm text-muted-foreground leading-tight break-all truncate">
          {title}
        </h4>
        <p className="text-2xl font-semibold">{value.toLocaleString()}</p>
      </div>
    </li>
  )
}
