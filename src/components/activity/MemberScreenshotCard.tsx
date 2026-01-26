"use client"

import { Trash2 } from "lucide-react"
import type { MemberScreenshotItem } from "@/lib/data/dummy-data"

interface MemberScreenshotCardProps {
  item: MemberScreenshotItem
  onImageClick?: () => void
  onDelete?: () => void
  isDeleted?: boolean
}

export function MemberScreenshotCard({ item, onImageClick, onDelete, isDeleted = false }: MemberScreenshotCardProps) {
  const getProgressColor = (progress: number) => {
    if (progress < 30) return "#facc15"
    if (progress < 50) return "#fb923c"
    if (progress < 70) return "#a3e635"
    return "#22c55e"
  }

  const showNoActivity = isDeleted || item.noActivity

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="p-3">
        <div className="mb-2 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="truncate text-xs font-medium text-slate-700">PT Aman Sejahtera...</h3>
            <p className="text-[10px] text-slate-400">No to-dos</p>
          </div>
        </div>
        {showNoActivity ? (
          <div className="mb-2 flex aspect-video items-center justify-center rounded border border-slate-200 bg-slate-50 text-xs text-slate-400">
            No activity
          </div>
        ) : (
          <button
            type="button"
            onClick={onImageClick}
            className="relative mb-2 aspect-video w-full overflow-hidden rounded border border-slate-200 bg-slate-50 text-left"
          >
            {item.image ? (
              <img src={item.image} alt="Screenshot" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                No image available
              </div>
            )}
          </button>
        )}
        <div className="mb-2 text-center text-xs font-medium text-blue-600">
          {showNoActivity ? "No screens" : (item.screenCount
            ? `${item.screenCount} screen${item.screenCount > 1 ? "s" : ""}`
            : "No screens")}
        </div>
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-slate-600">{item.time}</span>
          <button 
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.()
            }}
            className="text-slate-400 hover:text-red-600 transition-colors"
            aria-label="Delete screenshot"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
        <div className="space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full"
              style={{
                width: `${showNoActivity ? 0 : item.progress}%`,
                backgroundColor: showNoActivity ? "#e5e7eb" : getProgressColor(item.progress),
              }}
            />
          </div>
          <p className="text-[10px] text-slate-500">
            {showNoActivity ? "0% of 0 minutes" : `${item.progress}% of ${item.seconds ? `${item.minutes} seconds` : `${item.minutes} minutes`}`}
          </p>
        </div>
      </div>
    </div>
  )
}

