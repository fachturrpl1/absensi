"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Download,
  Pencil,
  Search,
  Settings,
  User,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

export default function ScreenshotsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [showCalendarPicker, setShowCalendarPicker] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const userMenuRef = useRef<HTMLDivElement>(null)
  const filterPanelRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  const isAllScreenshots = pathname?.includes("/all")
  const isEvery10Min = !isAllScreenshots

  const formattedDate = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }

    return selectedDate.toLocaleDateString("en-US", options)
  }, [selectedDate])

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const firstWeekday = new Date(year, month, 1).getDay()
    const startIndex = (firstWeekday + 6) % 7
    return Array.from({ length: 42 }).map((_, index) => {
      const dayOffset = index - startIndex + 1
      const date = new Date(year, month, dayOffset)
      return {
        date,
        label: date.getDate(),
        currentMonth: date.getMonth() === month,
      }
    })
  }, [calendarMonth])

  const changeCalendarMonth = (direction: "prev" | "next") => {
    setCalendarMonth((prev) => {
      const year = prev.getFullYear()
      const month = prev.getMonth()
      return new Date(year, month + (direction === "next" ? 1 : -1), 1)
    })
  }

  const changeDate = (direction: "prev" | "next") => {
    setSelectedDate((prev) => {
      const copy = new Date(prev)
      copy.setDate(prev.getDate() + (direction === "next" ? 1 : -1))
      setCalendarMonth(new Date(copy.getFullYear(), copy.getMonth(), 1))
      return copy
    })
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (!isFilterOpen) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isFilterOpen])

  useEffect(() => {
    if (!showCalendarPicker) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendarPicker(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showCalendarPicker])

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-white px-6 py-8 text-slate-800">
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
            className="flex min-w-[250px] justify-center gap-1 rounded-full px-1 py-1 shadow-sm"
            style={{ backgroundColor: "#A9A9A9" }}
          >
            <button
              onClick={() => router.push("/activity/screenshots/10min")}
              className={`rounded-full px-5 py-1.5 text-sm font-normal transition-all focus-visible:outline-none focus-visible:ring-0 ${isEvery10Min
                ? "bg-white text-slate-900 shadow-sm"
                : "bg-transparent text-slate-900 hover:bg-white/40"
              }`}
            >
              Every 10 min
            </button>
            <button
              onClick={() => router.push("/activity/screenshots/all")}
              className={`rounded-full px-5 py-1.5 text-sm font-normal transition-all focus-visible:outline-none focus-visible:ring-0 ${isAllScreenshots
                ? "bg-white text-slate-900 shadow-sm"
                : "bg-transparent text-slate-900 hover:bg-white/40"
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
          <Button
            variant="ghost"
            className="rounded-full p-0"
            onClick={() => changeDate("prev")}
          >
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </Button>
          <Button
            variant="ghost"
            className="rounded-full p-0"
            onClick={() => changeDate("next")}
          >
            <ArrowRight className="h-4 w-4 text-slate-600" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCalendarPicker((prev) => !prev)}
              className="flex items-center gap-2 text-sm font-medium text-slate-700"
            >
              <Calendar className="h-4 w-4 text-slate-500" />
              {formattedDate}
            </button>
            {showCalendarPicker && (
              <div
                ref={calendarRef}
                className="absolute left-0 z-20 mt-2 w-[320px] rounded-2xl border border-slate-100 bg-white text-slate-800 shadow-[0_30px_45px_rgba(15,23,42,0.2)]"
              >
                <div className="flex items-center justify-between px-5 py-4">
                  <button
                    type="button"
                    onClick={() => changeCalendarMonth("prev")}
                    className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="text-sm font-semibold text-slate-700">
                    {calendarMonth.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => changeCalendarMonth("next")}
                    className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((label) => (
                    <span key={label} className="flex justify-center">
                      {label}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2 px-4 pb-4 pt-2">
                  {calendarDays.map((day) => {
                    const isSelected =
                      day.date.toDateString() === selectedDate.toDateString()
                    return (
                      <button
                        key={day.date.toISOString()}
                        type="button"
                        onClick={() => {
                          setSelectedDate(new Date(day.date))
                          setCalendarMonth(
                            new Date(
                              day.date.getFullYear(),
                              day.date.getMonth(),
                              1
                            )
                          )
                          setShowCalendarPicker(false)
                        }}
                        className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm transition ${!day.currentMonth
                            ? "text-slate-300"
                            : "text-slate-700 hover:bg-slate-100"
                          } ${isSelected ? "bg-blue-500 text-white shadow-sm" : ""}`}
                      >
                        {day.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-1 items-start justify-end gap-4">
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              <User className="h-5 w-5 text-slate-500" />
              {isAllScreenshots ? "Muhammad Ma'Arif" : "Muhammad Ma'Arif"}
            </button>

            {isUserMenuOpen && (
              <div
                ref={userMenuRef}
                className="absolute right-0 z-10 mt-3 min-w-[300px] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_15px_35px_rgba(15,23,42,0.15)]"
              >
                <div className="flex gap-2">
                  <button className="flex-1 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600">
                    Tracked time
                  </button>
                  <button className="flex-1 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600">
                    No time tracked
                  </button>
                </div>
                <div className="mt-3 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                  <Search className="h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search members"
                    className="ml-2 w-full bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400"
                  />
                  <span className="text-sm font-semibold text-slate-500">×</span>
                </div>
                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-100 px-3 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-sm font-semibold text-slate-700">
                    Muhammad Ma&rsquo;Arif
                  </div>
                  <div className="text-xs text-blue-500">None</div>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsFilterOpen((prev) => !prev)}
              className="rounded-full border border-slate-800 px-4 py-2 text-sm font-semibold text-slate-800"
            >
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

      {isFilterOpen && (
        <>
          <div
            className="pointer-events-auto fixed inset-x-0 top-[220px] bottom-0 bg-slate-900/40"
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="pointer-events-none fixed top-[220px] right-0 bottom-0 z-30 flex max-w-[320px] flex-col px-6 py-8">
            <div
              className="pointer-events-auto flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-800 shadow-[0_25px_40px_rgba(15,23,42,0.18)]"
              ref={filterPanelRef}
              style={{ maxHeight: "calc(100vh - 220px)" }}
            >
              <div className="border-b border-slate-100 px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-blue-500">Filters</p>
              </div>
              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
                <div className="space-y-2 rounded-2xl border border-slate-200 bg-[#f5f8ff] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Member</p>
                  <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-[inset_0_1px_0_rgba(15,23,42,0.04)]">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="text-sm font-semibold text-slate-700">Muhammad Ma&rsquo;Arif</div>
                  </div>
                </div>
                {["Project", "Time Type", "Source", "Activity Level"].map((label) => (
                  <div key={label} className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-slate-500">{label}</p>
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500 shadow-sm">
                      <span>All {label.toLowerCase()}</span>
                      <span className="text-base text-slate-400">⌄</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 px-6 py-5">
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  Clear filters
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}