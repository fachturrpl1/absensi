"use client"

import { Pencil } from "lucide-react"

export default function AllScreenshotsPage() {
  return (
    <>
      {/* Screenshots Grid */}
      <div className="space-y-6">
        {/* Time Block 1: 9:00 am - 10:00 am */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium">9:00 am - 10:00 am</span>
            <span className="text-slate-400">Total time worked: 2:57:24</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {[
              { time: "9:03 am", progress: 28, minutes: 7, image: "/Screenshoot/Screenshot 2025-12-08 094631.png" },
              { time: "9:16 am", progress: 57, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-04 222401.png" },
              { time: "9:35 am", progress: 74, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-09 101315.png" },
              { time: "9:31 am", progress: 64, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-12 222910.png" },
              { time: "9:45 am", progress: 51, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-20 161303.png" },
              { time: "9:50 am", progress: 74, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-20 161319.png" },
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
              { time: "10:07 am", progress: 53, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-08 094631.png" },
              { time: "10:12 am", progress: 39, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-04 222401.png" },
              { time: "10:22 am", progress: 31, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-09 101315.png" },
              { time: "10:37 am", progress: 3, minutes: 39, seconds: true, image: "/Screenshoot/Screenshot 2026-01-12 222910.png" },
              { time: "10:40 am", progress: 0, minutes: 0, noActivity: true },
              { time: "10:50 am", progress: 2, minutes: 8, image: "/Screenshoot/Screenshot 2026-01-20 161303.png" },
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
                      {item.progress}% of {item.minutes} {item.seconds ? 'seconds' : 'minutes'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time Block 3: 11:00 am - 12:00 pm */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium">11:00 am - 12:00 pm</span>
            <span className="text-slate-400">Total time worked: 0:48:33</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {[
              { time: "11:04 am", progress: 72, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-09 101315.png" },
              { time: "11:17 am", progress: 45, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-04 222401.png" },
              { time: "11:21 am", progress: 68, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-12 222910.png" },
              { time: "11:34 am", progress: 52, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-08 094631.png" },
              { time: "11:43 am", progress: 0, minutes: 0, noActivity: true },
              { time: "11:53 am", progress: 15, minutes: 8, image: "/Screenshoot/Screenshot 2026-01-20 161319.png" },
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
                      {item.progress}% of {item.minutes} minutes
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time Block 4: 12:00 pm - 1:00 pm */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium">12:00 pm - 1:00 pm</span>
            <span className="text-slate-400">Total time worked: 0:37:47</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {[
              { time: "12:05 pm", progress: 58, minutes: 10, image: "/Screenshoot/Screenshot 2025-12-08 094631.png" },
              { time: "12:25 pm", progress: 42, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-20 161303.png" },
              { time: "12:33 pm", progress: 35, minutes: 10, image: "/Screenshoot/Screenshot 2026-01-09 101315.png" },
              { time: "12:49 pm", progress: 18, minutes: 7, image: "/Screenshoot/Screenshot 2026-01-04 222401.png" },
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
      </div>
    </>
  )
}