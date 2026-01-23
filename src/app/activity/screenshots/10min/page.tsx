"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Pencil,
  X,
} from "lucide-react"
import {
  DUMMY_MEMBER_INSIGHTS,
  DUMMY_MEMBER_SCREENSHOTS,
  DUMMY_MEMBERS,
  MemberInsightSummary,
  MemberScreenshotItem,
} from "@/lib/data/dummy-data"
import { useSelectedMemberContext } from "../selected-member-context"
// import { ActivityDialog } from "@/components/activity/ActivityDialog"

const formatDuration = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) {
    return `${minutes}m`
  }
  return `${hours}h ${minutes.toString().padStart(2, "0")}m`
}

// Parse time string like "9:00 am - 9:10 am" to get start time for sorting
const parseTimeForSort = (timeStr: string): number => {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i)
  if (!match || !match[1] || !match[2] || !match[3]) return 0
  
  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const period = match[3].toLowerCase()
  
  // Convert to 24-hour format
  if (period === "pm" && hours !== 12) {
    hours += 12
  } else if (period === "am" && hours === 12) {
    hours = 0
  }
  
  return hours * 60 + minutes // Return total minutes for easy comparison
}

const buildMemberTimeBlocks = (items: MemberScreenshotItem[], chunkSize = 6) => {
  if (!items.length) {
    return []
  }

  // Sort items by time instead of shuffling
  const sorted = [...items].sort((a, b) => {
    const timeA = parseTimeForSort(a.time)
    const timeB = parseTimeForSort(b.time)
    return timeA - timeB
  })
  
  const blocks = []
  for (let i = 0; i < sorted.length; i += chunkSize) {
    const chunk = sorted.slice(i, i + chunkSize)
    const totalMinutes = chunk.reduce((sum, item) => sum + (item.minutes ?? 0), 0)
    const summary = `Total time worked: ${formatDuration(totalMinutes)}`
    // Use the first item's time range start and last item's time range end for label
    const firstTime = chunk[0]?.time.split(" - ")[0] ?? ""
    const lastTime = chunk[chunk.length - 1]?.time.split(" - ")[1] ?? ""
    const label = firstTime && lastTime ? `${firstTime} - ${lastTime}` : chunk[0]?.time ?? `Block ${Math.floor(i / chunkSize) + 1}`
    blocks.push({ label, summary, items: chunk })
  }

  return blocks
}

export default function Every10MinPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { selectedMemberId, selectedDate } = useSelectedMemberContext()
  const fallbackMemberId = DUMMY_MEMBERS[0]?.id ?? null
  const activeMemberId = selectedMemberId ?? fallbackMemberId

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalIndex, setModalIndex] = useState(0)
  const [isMounted, setIsMounted] = useState(false)

  // Check if selected date is today or 1 day before, and determine which date it is
  const dateStatus = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const selected = new Date(selectedDate)
    selected.setHours(0, 0, 0, 0)
    
    // Check if selected date is today or yesterday
    const isToday = selected.getTime() === today.getTime()
    const isYesterday = selected.getTime() === yesterday.getTime()
    
    if (isToday) return { isValid: true, isToday: true, isYesterday: false }
    if (isYesterday) return { isValid: true, isToday: false, isYesterday: true }
    return { isValid: false, isToday: false, isYesterday: false }
  }, [selectedDate])

  const memberTimeBlocks = useMemo(() => {
    if (!activeMemberId || !dateStatus.isValid) return []
    const items = DUMMY_MEMBER_SCREENSHOTS[activeMemberId] ?? []
    
    // Jika kemarin, ambil subset data yang berbeda (misalnya ambil 6 item pertama untuk variasi)
    // Jika hari ini, ambil semua data
    const filteredItems = dateStatus.isYesterday 
      ? items.slice(0, Math.min(6, items.length)) // Ambil 6 item pertama untuk kemarin
      : items // Ambil semua untuk hari ini
    
    return buildMemberTimeBlocks(filteredItems)
  }, [activeMemberId, dateStatus])

  const flattenedScreenshots = useMemo(
    () => memberTimeBlocks.flatMap((block) => block.items),
    [memberTimeBlocks]
  )
  const currentScreenshot = flattenedScreenshots[modalIndex]

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    setModalIndex(0)
    setModalOpen(false)
  }, [activeMemberId])

  const openModal = (index: number) => {
    setModalIndex(index)
    setModalOpen(true)
  }

  const closeModal = () => setModalOpen(false)
  const goNext = () => {
    if (!flattenedScreenshots.length) {
      return
    }
    setModalIndex((prev) => (prev + 1) % flattenedScreenshots.length)
  }
  const goPrev = () => {
    if (!flattenedScreenshots.length) {
      return
    }
    setModalIndex((prev) => (prev - 1 + flattenedScreenshots.length) % flattenedScreenshots.length)
  }

  const memberSummary: MemberInsightSummary = useMemo(() => {
    // Jika tanggal tidak valid (lebih dari 1 hari sebelumnya), return data kosong
    if (!dateStatus.isValid) {
      return {
        memberId: "",
        totalWorkedTime: "0m",
        focusTime: "0m",
        focusDescription: "No data available for this date.",
        avgActivity: "0%",
        unusualCount: 0,
        unusualMessage: "No data available for this date.",
        classificationLabel: "No data",
        classificationSummary: "No data available for this date.",
        classificationPercent: 0,
      }
    }
    
    const fallbackSummary: MemberInsightSummary | undefined = fallbackMemberId ? DUMMY_MEMBER_INSIGHTS[fallbackMemberId] : undefined
    
    const activeSummary: MemberInsightSummary | undefined = activeMemberId ? DUMMY_MEMBER_INSIGHTS[activeMemberId] : undefined
    
    const baseSummary = activeSummary ?? fallbackSummary
    
    if (!baseSummary) {
      return {
        memberId: "",
        totalWorkedTime: "0m",
        focusTime: "0m",
        focusDescription: "No focus data yet.",
        avgActivity: "0%",
        unusualCount: 0,
        unusualMessage: "No unusual activity detected.",
        classificationLabel: "Unknown",
        classificationSummary: "No classification data.",
        classificationPercent: 0,
      }
    }
    
    // Jika kemarin, buat variasi data yang berbeda
    // Gunakan member yang berbeda untuk variasi (misalnya m2 untuk kemarin jika hari ini m1)
    if (dateStatus.isYesterday) {
      // Ambil data dari member yang berbeda untuk variasi, atau modifikasi data sedikit
      const alternateMemberId = activeMemberId === "m1" ? "m2" : activeMemberId === "m2" ? "m3" : activeMemberId === "m3" ? "m4" : activeMemberId === "m4" ? "m5" : "m1"
      const alternateSummary = DUMMY_MEMBER_INSIGHTS[alternateMemberId]
      return alternateSummary ?? baseSummary
    }
    
    // Hari ini, return data asli
    return baseSummary
  }, [activeMemberId, fallbackMemberId, dateStatus])

  let runningIndex = 0

  useEffect(() => {
    if (!modalOpen) return

    // Save original styles
    const originalBodyOverflow = document.body.style.overflow
    const originalHtmlOverflow = document.documentElement.style.overflow
    const originalPosition = document.body.style.position
    const originalWidth = document.body.style.width
    
    // Hide scrollbar and prevent scrolling
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.top = '0'
    document.documentElement.style.overflow = 'hidden'
    
    // Prevent touch move on mobile
    const preventScroll = (e: TouchEvent) => {
      e.preventDefault()
    }
    
    document.body.addEventListener('touchmove', preventScroll, { passive: false })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal()
      } else if (event.key === "ArrowRight") {
        goNext()
      } else if (event.key === "ArrowLeft") {
        goPrev()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.removeEventListener('touchmove', preventScroll)
      document.body.style.overflow = originalBodyOverflow
      document.body.style.position = originalPosition
      document.body.style.width = originalWidth
      document.body.style.top = ''
      document.documentElement.style.overflow = originalHtmlOverflow
    }
  }, [modalOpen])

  return (
    <>
      {/* <ActivityDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} /> */}


      {/* How Activity Works Section */}
      <div className="space-y-4">
        {/* <button
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <LineChart className="h-4 w-4" />
          How activity works
        </button> */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex gap-6">
            <div className="flex flex-1 flex-col justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Worked time</p>
              <h2 className="text-3xl font-semibold text-slate-900">{memberSummary.totalWorkedTime}</h2>
            </div>
            <div className="flex flex-1 flex-col justify-between border-l border-slate-200 pl-6">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Avg. activity</p>
              <span className="text-3xl font-semibold text-slate-700">{memberSummary.avgActivity}</span>
            </div>
          </div>
        </div>
        <div className="relative w-full rounded-t-2xl border-t border-l border-r border-slate-200 bg-white p-6 pb-10 shadow-sm mt-6 overflow-visible" style={{ borderBottom: 'none' }}>
          {/* Garis horizontal penuh yang melewati tengah tombol */}
          <div className="absolute left-0 right-0 bottom-0 flex items-center justify-center" style={{ transform: 'translateY(50%)' }}>
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-slate-200" />
            <div className="relative z-10 bg-white">
              <Button
                variant="outline"
                className="rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-medium text-slate-700 shadow-sm"
                onClick={() => {
                  console.log("View all clicked - activeMemberId:", activeMemberId)
                  console.log("selectedMemberId from context:", selectedMemberId)
                  if (activeMemberId) {
                    // Save memberId to sessionStorage for persistence
                    sessionStorage.setItem("screenshotSelectedMemberId", activeMemberId)
                    const url = `/insight/highlights?memberId=${encodeURIComponent(activeMemberId)}`
                    console.log("Navigating to:", url)
                    // Navigate to highlight page with memberId
                    router.push(url)
                  } else {
                    console.log("No activeMemberId, navigating without memberId")
                    router.push("/insight/highlights")
                  }
                }}
              >
                View all
              </Button>
            </div>
          </div>
          {/* <div className="absolute top-0 z-10 -translate-y-1/2" style={{ right: '1.5rem' }}>
            <Button variant="outline" size="sm" className="rounded-full border border-slate-200 bg-white px-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 shadow-sm">
              Insights
            </Button>
          </div> */}
          <div className="flex flex-col md:flex-row">
            {/* Focus Time */}
            <div className="flex flex-1 flex-col items-center justify-start gap-4 p-6 border-r border-slate-200">
              <div className="flex w-full items-center gap-1 text-xs font-semibold uppercase tracking-[0.05em] text-slate-500">
                Focus time
                <Info className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div className="flex flex-col items-center justify-center gap-3 py-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                  <svg className="h-8 w-8 text-blue-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{memberSummary.focusTime}</h3>
                <p className="text-center text-xs text-slate-500 max-w-[180px]">
                  {memberSummary.focusDescription}
                </p>
              </div>
            </div>

            {/* Unusual Activity Instances */}
            <div className="flex flex-1 flex-col items-center justify-start gap-4 p-6 border-r border-slate-200">
              <div className="flex w-full items-center gap-1 text-xs font-semibold uppercase tracking-[0.05em] text-slate-500">
                Unusual activity instances
                <Info className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div className="flex w-full flex-row items-center justify-center gap-4 py-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-slate-100 bg-white text-slate-700">
                  <span className="text-lg font-semibold">{memberSummary.unusualCount}</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-slate-700">
                    {memberSummary.unusualMessage.split("\n").map((line, index, arr) => (
                      <p
                        key={`${activeMemberId}-${index}`}
                        className="text-left leading-snug"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Work Time Classification */}
            <div className="flex flex-1 flex-col items-center justify-start gap-4 p-6">
              <div className="flex w-full flex-col gap-1 text-xs font-semibold uppercase tracking-[0.05em] text-slate-500">
                <span className="flex items-center gap-1">Work time classification</span>
                <span className="flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 text-slate-400" /> {memberSummary.classificationLabel}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center gap-2 py-4">
                <div className="w-full max-w-[180px] rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all"
                    style={{ width: `${memberSummary.classificationPercent}%` }}
                  />
                </div>
                <p className="text-center text-xs text-slate-500 max-w-[200px]">
                  {memberSummary.classificationSummary}
                </p>
              </div>
              <span className="text-[10px] text-slate-400">
                {memberSummary.classificationPercent}% of classification goal
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Screenshots Grid */}
      <div className="space-y-6">
        {!memberTimeBlocks.length ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center text-sm text-slate-500 shadow-sm">
            No screenshots were captured for this member yet.
          </div>
        ) : (
          memberTimeBlocks.map((block) => {
            const blockStart = runningIndex
            runningIndex += block.items.length
            return (
              <div key={`${block.label}-${blockStart}`} className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="font-medium">{block.label}</span>
                  <span className="text-slate-400">{block.summary}</span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                  {block.items.map((item, index) => {
                    const globalIndex = blockStart + index
                    return (
                      <div key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="p-3">
                          <div className="mb-2 flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="truncate text-xs font-medium text-slate-700">PT Aman Sejahtera...</h3>
                              <p className="text-[10px] text-slate-400">No to-dos</p>
                            </div>
                          </div>
                          {item.noActivity ? (
                            <div className="mb-2 flex aspect-video items-center justify-center rounded border border-slate-200 bg-slate-50 text-xs text-slate-400">
                              No activity
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openModal(globalIndex)}
                              className="relative mb-2 aspect-video w-full overflow-hidden rounded border border-slate-200 bg-slate-50 text-left"
                            >
                              <img src={item.image} alt="Screenshot" className="h-full w-full object-cover" />
                            </button>
                          )}
                          <div className="mb-2 text-center text-xs font-medium text-blue-600">
                            {item.screenCount
                              ? `${item.screenCount} screen${item.screenCount > 1 ? "s" : ""}`
                              : "No screens"}
                          </div>
                          <div className="mb-2 flex items-center justify-between text-xs">
                            <span className="text-slate-600">{item.time}</span>
                            <button className="text-slate-400 hover:text-slate-600">
                              <Pencil className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="space-y-1">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${item.progress}%`,
                                  backgroundColor:
                                    item.progress < 30
                                      ? "#facc15"
                                      : item.progress < 50
                                      ? "#fb923c"
                                      : item.progress < 70
                                      ? "#a3e635"
                                      : "#22c55e",
                                }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-500">
                              {item.progress}% of {item.seconds ? `${item.minutes} seconds` : `${item.minutes} minutes`}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>

      {isMounted && modalOpen && currentScreenshot && createPortal(
        <>
          <style dangerouslySetInnerHTML={{
            __html: `
              body:has(#screenshot-modal-overlay) {
                overflow: hidden !important;
              }
              #screenshot-modal-overlay {
                scrollbar-width: none;
                -ms-overflow-style: none;
              }
              #screenshot-modal-overlay::-webkit-scrollbar {
                display: none;
              }
            `
          }} />
          <div 
            id="screenshot-modal-overlay"
            className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center gap-4 p-8" 
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              width: '100vw', 
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(2px)',
              overflow: 'hidden',
              zIndex: 99999 
            }} 
            onClick={closeModal}
          >
            {/* Tombol Previous - Kiri */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                goPrev()
              }}
              aria-label="Previous screenshot"
              className="rounded-full bg-white p-4 shadow-2xl hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all border-2 border-slate-200"
              disabled={flattenedScreenshots.length <= 1}
            >
              <ChevronLeft className="h-8 w-8 text-slate-900" />
            </button>

            {/* Kotak Putih Modal */}
            <div className="relative flex flex-col max-w-6xl w-full max-h-[90vh] rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              {/* Tombol Close - Pojok Kanan Atas Kotak Putih */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeModal()
                }}
                aria-label="Close screenshot"
                className="absolute right-4 top-4 rounded-full bg-white p-3 shadow-2xl hover:bg-slate-100 z-20 border-2 border-slate-200 transition-all"
              >
                <X className="h-5 w-5 text-slate-900" />
              </button>
              <div className="flex items-center justify-center flex-1 min-h-0 mb-4 overflow-hidden">
                {currentScreenshot.image ? (
                  <img
                    src={currentScreenshot.image}
                    alt={currentScreenshot.time}
                    className="max-h-full max-w-full rounded-2xl object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full text-slate-400">
                    No image available
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center text-sm text-slate-600 shrink-0">
                <span>{currentScreenshot.time}</span>
              </div>
            </div>

            {/* Tombol Next - Kanan */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                goNext()
              }}
              aria-label="Next screenshot"
              className="rounded-full bg-white p-4 shadow-2xl hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all border-2 border-slate-200"
              disabled={flattenedScreenshots.length <= 1}
            >
              <ChevronRight className="h-8 w-8 text-slate-900" />
            </button>
          </div>
        </>,
        document.body
      )}
    </>
  )
}