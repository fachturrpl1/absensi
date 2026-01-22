"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  ChevronRight,
  Info,
  LineChart,
  Pencil,
  X,
} from "lucide-react"
// import { ActivityDialog } from "@/components/activity/ActivityDialog"

const timeBlocks = [
  {
    label: "9:00 am - 10:00 am",
    summary: "Total time worked: 0:57:54",
    items: [
      { time: "9:00 am - 9:10 am", progress: 28, minutes: 7, image: "/Screenshoot/Screenshot 2025-12-08 094631.png" },
      { time: "9:10 am - 9:20 am", progress: 57, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-04 222401.png" },
      { time: "9:20 am - 9:30 am", progress: 74, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-09 101315.png" },
      { time: "9:30 am - 9:40 am", progress: 64, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-12 222910.png" },
      { time: "9:40 am - 9:50 am", progress: 51, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-20 161303.png" },
      { time: "9:50 am - 10:00 am", progress: 74, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-20 161319.png" },
    ],
  },
  {
    label: "10:00 am - 11:00 am",
    summary: "Total time worked: 0:39:23",
    items: [
      { time: "10:00 am - 10:10 am", progress: 53, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-08 094631.png" },
      { time: "10:10 am - 10:20 am", progress: 39, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-04 222401.png" },
      { time: "10:20 am - 10:30 am", progress: 31, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-09 101315.png" },
      { time: "10:30 am - 10:40 am", progress: 3, minutes: 39, seconds: true, image: "/Screenshoot/Screenshot 2026-01-12 222910.png" },
      { time: "10:40 am - 10:50 am", progress: 0, minutes: 0, noActivity: true },
      { time: "10:50 am - 11:00 am", progress: 2, minutes: 8, image: "/Screenshoot/Screenshot 2026-01-20 161303.png" },
    ],
  },
]

export default function Every10MinPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalIndex, setModalIndex] = useState(0)
  const flattenedScreenshots = useMemo(
    () => timeBlocks.flatMap((block) => block.items),
    []
  )
  const currentScreenshot = flattenedScreenshots[modalIndex]

  const openModal = (index: number) => {
    setModalIndex(index)
    setModalOpen(true)
  }

  const closeModal = () => setModalOpen(false)
  const goNext = () =>
    setModalIndex((prev) => (prev + 1) % flattenedScreenshots.length)
  const goPrev = () =>
    setModalIndex((prev) => (prev - 1 + flattenedScreenshots.length) % flattenedScreenshots.length)

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
              <h2 className="text-5xl font-semibold text-slate-900">0:00</h2>
            </div>
            <div className="flex flex-1 flex-col justify-between border-l border-slate-200 pl-6">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Avg. activity</p>
              <span className="text-3xl font-semibold text-slate-700">—</span>
            </div>
          </div>
        </div>
        <div className="relative w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mt-6">
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
              <div className="flex flex-col items-center justify-center gap-2 py-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                  <svg className="h-8 w-8 text-blue-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">No data</h3>
                <p className="text-center text-xs text-slate-500 max-w-[180px]">
                  There was no data registered in the time period selected
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
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-slate-100 bg-white">
                  <span className="text-lg font-semibold text-slate-700">0</span>
                </div>
                <p className="text-sm text-slate-700">No unusual activity today</p>
              </div>
            </div>

            {/* Work Time Classification */}
            <div className="flex flex-1 flex-col items-center justify-start gap-4 p-6">
              <div className="flex w-full items-center gap-1 text-xs font-semibold uppercase tracking-[0.05em] text-slate-500">
                Work time classification
                <Info className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div className="flex flex-col items-center justify-center gap-2 py-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                  <svg className="h-8 w-8 text-blue-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">No data</h3>
                <p className="text-center text-xs text-slate-500 max-w-[180px]">
                  There was no data registered in the time period selected
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button variant="outline" className="rounded-full border border-slate-200 bg-white px-6 text-sm font-medium text-slate-700 shadow-sm">
            Get add-on
          </Button>
        </div>
      </div>

      {/* Screenshots Grid */}
      <div className="space-y-6">
        {timeBlocks.map((block) => (
          <div key={block.label} className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="font-medium">{block.label}</span>
              <span className="text-slate-400">{block.summary}</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              {block.items.map((item) => {
                const globalIndex = flattenedScreenshots.findIndex(
                  (s) => s.time === item.time && s.image === item.image
                )
                return (
                  <div key={item.time} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
                      <div className="mb-2 text-center text-xs font-medium text-blue-600">1 screen</div>
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
        ))}
      </div>

      {modalOpen && currentScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70">
          <div className="relative w-full max-w-[min(90vw,900px)] max-h-[90vh] overflow-hidden rounded-3xl bg-white p-6 shadow-2xl">
            <button
              aria-label="Close screenshot"
              className="absolute right-4 top-4 rounded-full bg-white/80 p-2 shadow"
              onClick={closeModal}
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={currentScreenshot.image}
              alt={currentScreenshot.time}
              className="mb-4 max-h-[70vh] max-w-full w-full rounded-2xl object-contain"
            />
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>{currentScreenshot.time}</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={goPrev}
                  aria-label="Previous screenshot"
                  className="rounded-full border border-slate-200 bg-white p-2 shadow-sm hover:bg-slate-50 disabled:text-slate-300"
                  disabled={flattenedScreenshots.length <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={goNext}
                  aria-label="Next screenshot"
                  className="rounded-full border border-slate-200 bg-white p-2 shadow-sm hover:bg-slate-50 disabled:text-slate-300"
                  disabled={flattenedScreenshots.length <= 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}