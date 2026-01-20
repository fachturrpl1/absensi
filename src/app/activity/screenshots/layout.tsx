"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Download,
  Pencil,
  Settings,
  User,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

export default function ScreenshotsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  
  const isAllScreenshots = pathname?.includes("/all")
  const isEvery10Min = !isAllScreenshots

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-slate-50 px-6 py-8 text-slate-800">
      {/* Header */}
      <div className="relative flex w-full items-center justify-between gap-4">
        <div className="flex-1 min-w-[220px]">
          <h1 className="text-4xl font-semibold tracking-tight">Screenshots</h1>
          <p className="mt-1 flex items-center gap-2 text-base text-slate-600">
            <Clock className="h-4 w-4 text-slate-500" />
            Your team has not tracked any time.{" "}
            <span className="text-blue-600 underline underline-offset-2">Get Started</span>
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="absolute left-1/2 flex -translate-x-1/2 transform">
          <div
            className="flex min-w-[250px] justify-center gap-0 rounded-full px-1 py-1 shadow-sm"
            style={{ backgroundColor: "#A9A9A9" }}
          >
            <button
              onClick={() => router.push("/activity/screenshots/10min")}
              className={`rounded-full px-5 py-1.5 text-sm font-normal transition-all ${
                isEvery10Min
                  ? "bg-white text-slate-900 shadow-sm"
                  : "bg-slate-300/80 text-slate-600 hover:text-slate-900"
              }`}
            >
              Every 10 min
            </button>
            <button
              onClick={() => router.push("/activity/screenshots/all")}
              className={`rounded-full px-5 py-1.5 text-sm font-normal transition-all ${
                isAllScreenshots
                  ? "bg-white text-slate-900 shadow-sm"
                  : "bg-slate-300/80 text-slate-600 hover:text-slate-900"
              }`}
            >
              All screenshots
            </button>
          </div>
        </div>

        {/* Settings Button */}
        <div className="flex min-w-[160px] justify-end">
          <Button variant="outline" className="flex items-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-medium text-slate-700">
            <Settings className="h-4 w-4 text-slate-700" />
            Settings
          </Button>
        </div>
      </div>

      {/* Date & User Controls */}
      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1 text-sm font-medium text-slate-700">
          <Button variant="ghost" className="rounded-full p-0">
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </Button>
          <Button variant="ghost" className="rounded-full p-0">
            <ArrowRight className="h-4 w-4 text-slate-600" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Calendar className="h-4 w-4 text-slate-500" />
          {isAllScreenshots ? "Fri, Aug 22, 2025" : "Tue, Jan 20, 2026"}
          <Separator orientation="vertical" className="h-6" />
          <span className="flex items-center gap-1">
            WIB
            <ArrowDownRight className="h-3 w-3 text-slate-500" />
          </span>
        </div>

        <div className="flex flex-1 items-start justify-end gap-4">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            <User className="h-5 w-5 text-slate-500" />
            {isAllScreenshots ? "Pradhipa Wicaksana" : "Muhammad Ma\u0027Arif"}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button variant="outline" className="rounded-full border border-blue-400 px-4 py-2 text-sm font-semibold text-blue-600">
              Filters
            </Button>
            <div className="flex items-center gap-2 text-slate-500">
              <Pencil className="h-5 w-5" />
              <Download className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Child Content */}
      {children}
    </div>
  )
}

