"use client"

import { useState, useEffect } from "react"
import { Trash2 } from "lucide-react"
import type { MemberScreenshotItem } from "@/lib/data/dummy-data"

interface MemberScreenshotCardProps {
  item: MemberScreenshotItem
  onImageClick?: () => void
  onDelete?: () => void
  isDeleted?: boolean
  memberId?: string
}

export function MemberScreenshotCard({ item, onImageClick, onDelete, isDeleted = false, memberId }: MemberScreenshotCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [shouldBlur, setShouldBlur] = useState(false)
  
  // Get blur setting for this member and listen for changes
  useEffect(() => {
    if (typeof window === "undefined" || !memberId) {
      setShouldBlur(false)
      return
    }

    const checkBlurSetting = () => {
      try {
        const saved = localStorage.getItem("screenshotBlurSettings")
        if (saved) {
          const blurSettings = JSON.parse(saved)
          console.log("Blur settings for memberId:", memberId, blurSettings)
          if (blurSettings.memberBlurs && blurSettings.memberBlurs[memberId] !== undefined) {
            const blurValue = blurSettings.memberBlurs[memberId]
            console.log("Member blur setting:", memberId, "=", blurValue)
            setShouldBlur(blurValue)
          } else {
            const globalValue = blurSettings.globalBlur || false
            console.log("Using global blur:", globalValue)
            setShouldBlur(globalValue)
          }
        } else {
          setShouldBlur(false)
        }
      } catch (e) {
        console.error("Error reading blur settings:", e)
        setShouldBlur(false)
      }
    }

    // Check immediately
    checkBlurSetting()

    // Listen for storage changes (when blur setting is updated in another tab/component)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "screenshotBlurSettings") {
        checkBlurSetting()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Also listen for custom event (for same-tab updates)
    const handleCustomStorageChange = () => {
      checkBlurSetting()
    }

    window.addEventListener("blurSettingsChanged", handleCustomStorageChange)

    // Poll for changes (fallback if events don't work)
    const interval = setInterval(checkBlurSetting, 500)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("blurSettingsChanged", handleCustomStorageChange)
      clearInterval(interval)
    }
  }, [memberId])

  const getProgressColor = (progress: number) => {
    if (progress < 30) return "#facc15"
    if (progress < 50) return "#fb923c"
    if (progress < 70) return "#a3e635"
    return "#22c55e"
  }

  const showNoActivity = isDeleted || item.noActivity || !item.image

  // Calculate mouse and keyboard percentages from overall progress
  // This is a simplified calculation - in real app, this would come from actual data
  const calculateActivityBreakdown = (overallProgress: number) => {
    // Simulate mouse and keyboard activity based on overall progress
    // Mouse activity is typically higher than keyboard
    const mousePercentage = Math.round(overallProgress * 0.68) // ~68% of overall
    const keyboardPercentage = Math.round(overallProgress * 0.49) // ~49% of overall
    return {
      overall: overallProgress,
      mouse: mousePercentage,
      keyboard: keyboardPercentage
    }
  }

  const activityBreakdown = showNoActivity ? { overall: 0, mouse: 0, keyboard: 0 } : calculateActivityBreakdown(item.progress)

  // Jika tidak ada activity DAN bukan dari delete (placeholder), hanya tampilkan block sederhana
  if (showNoActivity && !isDeleted && (!item.time || item.time === "")) {
    return (
      <div className="flex aspect-video items-center justify-center rounded border border-slate-200 bg-slate-50 text-xs text-slate-400">
        No activity
      </div>
    )
  }

  // Jika dihapus atau tidak ada activity, tampilkan card lengkap tapi gambar diganti "No activity"
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-visible">
      <div className="p-3 overflow-visible">
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
            <img 
              src={item.image} 
              alt="Screenshot" 
              className={`h-full w-full object-cover transition-all duration-200 ${shouldBlur ? "blur-md" : ""}`}
              style={{
                filter: shouldBlur ? "blur(8px)" : "none",
                WebkitFilter: shouldBlur ? "blur(8px)" : "none"
              }}
            />
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
        <div className="space-y-1 relative overflow-visible">
          <div 
            className="h-2 w-full rounded-full bg-slate-200 relative overflow-visible"
            onMouseEnter={() => !showNoActivity && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${showNoActivity ? 0 : item.progress}%`,
                backgroundColor: showNoActivity ? "#e5e7eb" : getProgressColor(item.progress),
              }}
            />
          </div>
          {/* Tooltip - positioned below the progress bar, outside the progress bar container */}
          {isHovered && !showNoActivity && (
            <>
              {/* Vertical line connecting tooltip to progress bar */}
              <div 
                className="absolute left-1/2 transform -translate-x-1/2 pointer-events-none z-40"
                style={{ 
                  top: '100%',
                  height: '8px',
                  width: '1px',
                  backgroundColor: '#4b5563'
                }}
              />
              <div 
                className="absolute px-3 py-2 bg-gray-800 text-white text-xs rounded shadow-lg z-50 min-w-[180px] pointer-events-none opacity-90"
                style={{ 
                  top: 'calc(100% + 8px)',
                  left: '50%',
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="space-y-1">
                  <div className="font-semibold">Overall: {activityBreakdown.overall}%</div>
                  <div className="h-px bg-gray-600 my-1"></div>
                  <div className="text-gray-300">
                    Mouse: {activityBreakdown.mouse}% Keyboard: {activityBreakdown.keyboard}%
                  </div>
                </div>
                {/* Arrow pointing up */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-2 h-2 bg-gray-800 transform rotate-45"></div>
                </div>
              </div>
            </>
          )}
          <p className="text-[10px] text-slate-500">
            {showNoActivity ? "0% of 0 minutes" : `${item.progress}% of ${item.seconds ? `${item.minutes} seconds` : `${item.minutes} minutes`}`}
          </p>
        </div>
      </div>
    </div>
  )
}

