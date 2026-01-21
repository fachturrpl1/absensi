"use client"

import { Button } from "@/components/ui/button"
import {
  Info,
  LineChart,
  Pencil,
} from "lucide-react"

const insightCards = [
  {
    title: "Unusual activity instances",
    circleBorder: "border-red-500",
    bullets: [
      { text: "Suspicious app / URL", color: "bg-red-500" },
      { text: "Unusually high activity", color: "bg-amber-500" },
      { text: "Low single input activity", color: "bg-amber-200" },
    ],
  },
  {
    title: "Focus time",
    circleBorder: "border-blue-500",
    description: "Learn about distractions keeping your team from completing tasks",
  },
  {
    title: "Work time classification",
    circleBorder: "border-orange-500",
    bullets: [
      { text: "Core work", color: "bg-blue-500" },
      { text: "Non-core work", color: "bg-slate-600" },
      { text: "Unproductive", color: "bg-orange-500" },
    ],
  },
]

export default function Every10MinPage() {
  return (
    <>
      {/* How Activity Works Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
          <LineChart className="h-4 w-4" />
          How activity works
        </div>
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
          <div className="absolute top-0 z-10 -translate-y-1/2" style={{ right: '1.5rem' }}>
            <Button variant="outline" size="sm" className="rounded-full border border-slate-200 bg-white px-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 shadow-sm">
              Insights
            </Button>
          </div>
          <div className="flex flex-col gap-4 md:flex-row">
            {insightCards.map((card, idx) => (
              <div
                key={card.title}
                className={`flex flex-1 flex-col justify-between gap-4 px-4 py-2 ${idx > 0 ? "border-l border-slate-200" : ""} ${idx === 1 ? "border-r border-slate-200" : ""}`}
              >
              <div className="flex items-center gap-4">
                <div
                  className={`flex aspect-square h-14 flex-none items-center justify-center rounded-full border-4 ${card.circleBorder}`}
                >
                  <span className="text-2xl font-semibold text-slate-600">?</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
                    {card.title}
                    <Info className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  {card.description && (
                    <p className="text-sm text-slate-600">{card.description}</p>
                  )}
                  {card.bullets && (
                    <ul className="space-y-1 text-sm text-slate-600">
                      {card.bullets.map((item) => (
                        <li key={`${card.title}-${item.text}`} className="flex items-center gap-2">
                          <span className={`inline-block h-2 w-2 rounded-full ${item.color}`} />
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="mt-auto">
                <Button
                  variant="ghost"
                  className="w-full rounded-full border border-blue-400 bg-blue-500 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white"
                >
                  Find out more
                </Button>
              </div>
            </div>
          ))}
          </div>
          <div className="absolute z-10" style={{ bottom: '0', left: 'calc(50% + 0.5rem)', transform: 'translateX(-50%) translateY(50%)' }}>
            <Button variant="outline" className="rounded-full border border-slate-200 bg-white px-6 text-sm font-medium text-slate-700 shadow-sm">
              Get add-on
            </Button>
          </div>
        </div>
      </div>

      {/* Screenshots Grid */}
      <div className="space-y-6">
        {/* Time Block 1: 9:00 am - 10:00 am */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium">9:00 am - 10:00 am</span>
            <span className="text-slate-400">Total time worked: 0:57:54</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {[
              { time: "9:00 am - 9:10 am", progress: 28, minutes: 7, image: "/Screenshoot/Screenshot 2025-12-08 094631.png" },
              { time: "9:10 am - 9:20 am", progress: 57, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-04 222401.png" },
              { time: "9:20 am - 9:30 am", progress: 74, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-09 101315.png" },
              { time: "9:30 am - 9:40 am", progress: 64, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-12 222910.png" },
              { time: "9:40 am - 9:50 am", progress: 51, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-20 161303.png" },
              { time: "9:50 am - 10:00 am", progress: 74, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-20 161319.png" },
            ].map((item, idx) => (
              <div key={idx} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="p-3">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="truncate text-xs font-medium text-slate-700">PT Aman Sejahtera...</h3>
                      <p className="text-[10px] text-slate-400">No to-dos</p>
                    </div>
                  </div>
                  <div className="relative mb-2 aspect-video overflow-hidden rounded border border-slate-200 bg-slate-50">
                    <img src={item.image} alt="Screenshot" className="h-full w-full object-cover" />
                  </div>
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
                          backgroundColor: item.progress < 30 ? '#facc15' :
                                         item.progress < 50 ? '#fb923c' :
                                         item.progress < 70 ? '#a3e635' :
                                         '#22c55e'
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">{item.progress}% of {item.minutes} minutes</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time Block 2: 10:00 am - 11:00 am */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium">10:00 am - 11:00 am</span>
            <span className="text-slate-400">Total time worked: 0:39:23</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {[
              { time: "10:00 am - 10:10 am", progress: 53, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-08 094631.png" },
              { time: "10:10 am - 10:20 am", progress: 39, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-04 222401.png" },
              { time: "10:20 am - 10:30 am", progress: 31, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-09 101315.png" },
              { time: "10:30 am - 10:40 am", progress: 3, minutes: 39, seconds: true, image: "/Screenshoot/Screenshot 2026-01-12 222910.png" },
              { time: "10:40 am - 10:50 am", progress: 0, minutes: 0, noActivity: true },
              { time: "10:50 am - 11:00 am", progress: 2, minutes: 8, image: "/Screenshoot/Screenshot 2026-01-20 161303.png" },
            ].map((item, idx) => (
              <div key={idx} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
                    <div className="relative mb-2 aspect-video overflow-hidden rounded border border-slate-200 bg-slate-50">
                      <img src={item.image} alt="Screenshot" className="h-full w-full object-cover" />
                    </div>
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
                          backgroundColor: item.progress < 30 ? '#facc15' :
                                         item.progress < 50 ? '#fb923c' :
                                         item.progress < 70 ? '#a3e635' :
                                         '#22c55e'
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {item.progress}% of {item.seconds ? `${item.minutes} seconds` : `${item.minutes} minutes`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
