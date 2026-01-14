"use client"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { DateFilterState } from "@/components/analytics/date-filter-bar"
import { DateFilterBar } from "@/components/analytics/date-filter-bar"
import { useOrgStore } from "@/store/org-store"
import { formatInTimeZone } from "date-fns-tz"
import { getAllAttendance, type GetAttendanceResult, type AttendanceListItem } from "@/action/attendance"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { AnimatePresence, motion } from "framer-motion"
import {
  Search,
  RotateCcw,
  Plus,
  Download,
  Edit,
  Trash2,
  CheckCircle2,
  Timer,
  XCircle,
  AlertCircle,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PaginationFooter } from "@/components/pagination-footer"
import { cn } from "@/lib/utils"
import { formatLocalTime } from "@/utils/timezone"

function initialsFromName(name: string): string {
   const parts = (name || "").trim().split(/\s+/).filter(Boolean)
   const first = parts[0]?.[0] ?? ""
   const second = parts[1]?.[0] ?? ""
   return (first + second).toUpperCase()
}

// Tambahan helper untuk konsistensi tanggal sesuai timezone organisasi
function toOrgYMD(d: Date, tz?: string): string {
  if (!tz || tz === "UTC") {
    const dt = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    return dt.toISOString().slice(0, 10)
  }
  try {
    return formatInTimeZone(d, tz, "yyyy-MM-dd")
  } catch {
    const dt = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    return dt.toISOString().slice(0, 10)
  }
}

// Clone lokal (sementara tetap delegasi ke komponen lama agar UI identik)
function ModernAttendanceListCloned() {
  const orgStore = useOrgStore()

  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null)
   const [dateRange, setDateRange] = useState<DateFilterState>(() => {
     const start = new Date()
     start.setHours(0, 0, 0, 0)
     const end = new Date()
     end.setHours(23, 59, 59, 999)
     return { from: start, to: end, preset: "today" }
   })

  const [searchInput, setSearchInput] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [selectedRecords, setSelectedRecords] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)
  const [totalItems, setTotalItems] = useState<number>(0)
  const [attendanceData, setAttendanceData] = useState<AttendanceListItem[]>([])
  const [userTimezone, setUserTimezone] = useState<string>("UTC")
  //state list party
  const [initialized, setInitialized] = useState(false)

  // Tambahan untuk toolbar
  const [departments, setDepartments] = useState<string[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const [isSubmitting] = useState(false)
  const SHOW_LOCATION = false

  // const fetchRef = useRef<(opts?: { mode?: "full" | "single"; id?: string }) => void>(() => {})
  // useEffect(() => { fetchRef.current = fetchData }, [fetchData])

  // request id guard untuk menghindari stale update
  const latestRequestRef = useRef(0)

  useEffect(() => {
    const orgId = selectedOrgId || orgStore.organizationId
    if (!orgId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`attendance_records:${orgId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance_records' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const id = String((payload.new as { id?: string | number })?.id ?? "")
            if (id) fetchRef.current({ mode: 'single', id })
            else fetchRef.current({ mode: 'full' })
          } else if (payload.eventType === 'DELETE') {
            const id = String((payload.old as { id?: string | number })?.id ?? "")
            if (id) {
              setAttendanceData(prev => prev.filter(r => r.id !== id))
              setTotalItems(prev => Math.max(0, prev - 1))
            } else {
              fetchRef.current({ mode: 'full' })
            }
          }
        }
      )
      .subscribe()

    return () => {
      try { supabase.removeChannel(channel) } catch {}
    }
  }, [selectedOrgId, orgStore.organizationId])

  // Fallback org dari cookie jika store belum siap
  useEffect(() => {
    if (selectedOrgId || orgStore.organizationId) return
    try {
      const m = document.cookie.match(/(?:^|; )org_id=(\d+)/)
      if (m && m[1]) {
        const oid = Number(m[1])
        if (!Number.isNaN(oid)) setSelectedOrgId(oid)
      }
    } catch {}
  }, [selectedOrgId, orgStore.organizationId])

  // Debounce input ke query
  useEffect(() => {
    const timer = window.setTimeout(() => setSearchQuery(searchInput), 10)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  // Mounted flag untuk skeleton di toolbar filter
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Recompute departments dari attendanceData
  useEffect(() => {
    const uniqueDepts = Array.from(new Set(
      attendanceData.map((r) => r.member?.department)
    )).filter((d): d is string => Boolean(d && d !== "No Department")).sort()
    const same = uniqueDepts.length === departments.length && uniqueDepts.every((d, i) => d === departments[i])
    if (!same) setDepartments(uniqueDepts)
  }, [attendanceData, departments])

  // Key untuk cache (match dgn komponen lama)
  const cacheKeyBase = useMemo(() => {
    const orgId = selectedOrgId || orgStore.organizationId || "no-org"
    const localToYMD = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
    const effFrom = (userTimezone && userTimezone !== "UTC") ? formatInTimeZone(dateRange.from, userTimezone, "yyyy-MM-dd") : localToYMD(dateRange.from)
    const effTo = (userTimezone && userTimezone !== "UTC") ? formatInTimeZone(dateRange.to, userTimezone, "yyyy-MM-dd") : localToYMD(dateRange.to)
    const status = statusFilter || "all"
    const dept = departmentFilter || "all"
    const q = searchQuery || ""
    return `attendance:list:${orgId}:p=${currentPage}:l=${itemsPerPage}:from=${effFrom}:to=${effTo}:status=${status}:dept=${dept}:q=${q}`
  }, [selectedOrgId, orgStore.organizationId, currentPage, itemsPerPage, dateRange.from, dateRange.to, statusFilter, departmentFilter, searchQuery, userTimezone])

   // Fetch attendance data via server action (sudah Anda tambahkan di Tahap-5)
   // helper untuk merge 1 record ke state saat incremental
  // function upsertRecord(next: AttendanceListItem) {
  //   setAttendanceData(prev => {
  //     const idx = prev.findIndex(r => r.id === next.id)
  //     if (idx >= 0) {
  //       const copied = [...prev]
  //       copied[idx] = next
  //       return copied
  //     }
  //     return [next, ...prev]
  //   })
  //   setTotalItems(prev => Math.max(prev, 1))
  // }

  const fetchData = useCallback(
    async (opts?: { mode?: "full" | "single"; id?: string }) => {
      const orgId = selectedOrgId || orgStore.organizationId
      if (!orgId) {
        setLoading(true)
        return
      }

      const mode = opts?.mode ?? "full"
      const recordId = opts?.id

      if (mode === "single" && recordId) {
        // Rekomendasi: gunakan API route GET /api/attendance-records?id=...&organizationId=...
        // agar hasilnya sama dengan shape AttendanceListItem.
        // Di sini contoh minimal: fallback ke full fetch jika endpoint by-id belum tersedia.
        // Ketika endpoint by-id siap, ganti blok ini:
        //   const one = await fetchSingleAttendance(recordId, orgId)
        //   if (one && isRecordMatchesActiveFilters(one)) upsertRecord(one)
        await (async () => {
          await fetchData({ mode: "full" })
        })()
        return
      }

      setLoading(true)
      const reqId = latestRequestRef.current + 1
      latestRequestRef.current = reqId

      try {
        const searchParam = (searchQuery || "").trim()
        const res = await getAllAttendance({
          page: currentPage,
          limit: itemsPerPage,
          dateFrom: toOrgYMD(dateRange.from, userTimezone),
          dateTo: toOrgYMD(dateRange.to, userTimezone),
          search: searchParam.length >= 2 ? searchParam : undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          department: departmentFilter === "all" ? undefined : departmentFilter,
          organizationId: orgId,
        })

        const result: GetAttendanceResult = res as GetAttendanceResult
        if (reqId !== latestRequestRef.current) return

        if (result.success) {
          const data = (result.data || []) as AttendanceListItem[]
          setAttendanceData(data)
          setTotalItems(Math.max(result.meta?.total || 0, data.length))
          if (data.length > 0) {
            const nextTz = data[0]?.timezone ?? "UTC"
            setUserTimezone((prev) => (prev === nextTz ? prev : nextTz))
          }
        } else {
          setAttendanceData([])
          setTotalItems(0)
        }
      } catch {
        if (reqId !== latestRequestRef.current) return
      } finally {
        if (reqId === latestRequestRef.current) setLoading(false)
      }
    },
    [selectedOrgId, orgStore.organizationId, currentPage, itemsPerPage, dateRange.from, dateRange.to, searchQuery, statusFilter, departmentFilter, userTimezone]
  )

  const fetchRef = useRef<(opts?: { mode?: "full" | "single"; id?: string }) => Promise<void>>(async () => {})
  useEffect(() => { fetchRef.current = fetchData }, [fetchData])

useEffect(() => {
  const orgId = selectedOrgId || orgStore.organizationId
  if (!orgId) return
  fetchData({ mode: 'full' })
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [dateRange.from, dateRange.to, statusFilter, departmentFilter, searchQuery, itemsPerPage, currentPage, selectedOrgId, orgStore.organizationId])

  // Handler Selected Actions (sementara no-op; akan diisi setelah list pindah)
  const handleEditClick = () => {
    // no-op: akan diimplementasi setelah UI list & selection dipindah
  }
  const handleDeleteMultiple = () => {
    // no-op: akan diimplementasi setelah UI list & selection dipindah
  }

  useEffect(() => {
    // Jika data sudah ada, kita anggap initialized
    if (attendanceData) setInitialized(true)
  }, [attendanceData])

 const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      case "late":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "absent":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      case "leave":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle2 className="h-3 w-3" />
      case "late":
        return <Timer className="h-3 w-3" />
      case "absent":
        return <XCircle className="h-3 w-3" />
      default:
        return <AlertCircle className="h-3 w-3" />
    }
  }

  function MethodDisplay(props: { checkInMethod?: string | null; checkOutMethod?: string | null }) {
    const fmt = (s?: string | null) => {
      if (!s) return "None"
      return String(s).toLowerCase().replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    }
    return (
      <div className="flex flex-col gap-1 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">IN:</span>
          <span className="font-medium">{fmt(props.checkInMethod)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">OUT:</span>
          <span className="font-medium">{fmt(props.checkOutMethod)}</span>
        </div>
      </div>
    )
  }

const LocationDisplay: React.FC<{ checkInLocationName: string | null; checkOutLocationName: string | null }> = () => null

  const handleSelectAll = () => {
    if (selectedRecords.length === attendanceData.length) {
      setSelectedRecords([])
    } else {
      setSelectedRecords(attendanceData.map((r) => r.id))
    }
  }
  const handleEditSingle = (_rec: AttendanceListItem) => {
    // no-op sementara
  }
  const handleDeleteClick = (_id: string) => {
    // no-op sementara
  }
  
  // Flag sementara agar UI TIDAK berubah (toolbar baru tidak ditampilkan)
  const SHOW_LOCAL_TOOLBAR = true
  const SHOW_LOCAL_LIST = true


  return (
     <>
       {SHOW_LOCAL_TOOLBAR && (
         <div className="space-y-6">
           <Card className="border border-gray-200 shadow-sm">
             <CardContent className="p-4 md:p-6">
               <div className="flex items-center gap-2 flex-wrap">
                 {/* Search */}
                 <div className="flex-1 min-w-[260px] relative">
                   <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                   <Input
                     placeholder="Search by name or department..."
                     value={searchInput}
                     onChange={(e) => setSearchInput(e.target.value)}
                     onKeyDown={(e) => {
                       if (e.key === "Enter") setSearchQuery(searchInput)
                     }}
                     className="pl-10 border-gray-300"
                   />
                 </div>

                 {/* Refresh */}
                 <Button
                   variant="outline"
                   size="icon"
                   onClick={() => {
                     try {
                       localStorage.removeItem(cacheKeyBase)
                       localStorage.removeItem(`${cacheKeyBase}:loading`)
                     } catch {}
                     fetchData()
                   }}
                   title="Refresh"
                   className="border-gray-300 shrink-0"
                 >
                   <RotateCcw className="w-4 h-4" />
                 </Button>

                 {/* Date Filter */}
                 <div className="shrink-0">
                   <DateFilterBar
                     dateRange={dateRange}
                     onDateRangeChange={setDateRange}
                   />
                 </div>

                 {/* Status Filter */}
                 <div className="flex items-center gap-2 shrink-0">
                   {isMounted ? (
                     <Select value={statusFilter} onValueChange={setStatusFilter}>
                       <SelectTrigger className="w-40 border-gray-300">
                         <SelectValue placeholder="Status" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="all">All Status</SelectItem>
                         <SelectItem value="present">Present</SelectItem>
                         <SelectItem value="late">Late</SelectItem>
                         <SelectItem value="absent">Absent</SelectItem>
                         <SelectItem value="leave">On Leave</SelectItem>
                       </SelectContent>
                     </Select>
                   ) : (
                     <div className="w-40 h-9 border border-gray-300 rounded bg-muted/50" aria-hidden />
                   )}
                 </div>

                 {/* Department Filter */}
                 <div className="flex items-center gap-2 shrink-0">
                   {isMounted ? (
                     <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                       <SelectTrigger className="w-[180px] border-gray-300">
                         <SelectValue placeholder="Department" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="all">All Groups</SelectItem>
                         {departments.map((dept) => (
                           <SelectItem key={dept} value={dept}>
                             {dept}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   ) : (
                     <div className="w-[180px] h-9 border border-gray-300 rounded bg-muted/50" aria-hidden />
                   )}
                 </div>

                 {/* Manual Entry & Import */}
                 <Link href="/attendance/list/add" className="shrink-0">
                   <Button className="bg-black text-white hover:bg-black/90 whitespace-nowrap">
                     <Plus className="mr-2 h-4 w-4" />
                     Manual Entry
                   </Button>
                 </Link>
                 <Link href="/attendance/list/import" className="shrink-0">
                   <Button variant="outline" className="whitespace-nowrap">
                     <Download className="mr-2 h-4 w-4" />
                     Import
                   </Button>
                 </Link>
               </div>

               {/* Selected Actions */}
               <AnimatePresence>
                 {selectedRecords.length > 0 && (
                   <motion.div
                     initial={{ opacity: 0, y: -10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2"
                   >
                     <span className="text-sm font-medium">
                       {selectedRecords.length} selected
                     </span>
                     <Separator orientation="vertical" className="h-6" />
                     <Button variant="ghost" size="sm" onClick={handleEditClick}>
                       <Edit className="mr-2 h-4 w-4" />
                       {selectedRecords.length === 1 ? "Edit" : "Bulk Edit"}
                     </Button>
                     <Button
                       variant="destructive"
                       size="sm"
                       onClick={handleDeleteMultiple}
                       disabled={isSubmitting}
                     >
                       <Trash2 className="mr-2 h-4 w-4" />
                       Delete Selected
                     </Button>
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => setSelectedRecords([])}
                       className="ml-auto"
                     >
                       Clear Selection
                     </Button>
                   </motion.div>
                 )}
               </AnimatePresence>
             </CardContent>
           </Card>
         </div>
       )}

      {SHOW_LOCAL_LIST && (
        <div className="space-y-6">
          {/* Attendance List - LIST MODE */}
            <Card>
              <CardContent className="p-0">
                {/* Mobile Card View - hidden dulu (sesuai komponen lama) */}
                <div className="hidden">
                  {(loading || !initialized) ? (
                    <div className="divide-y">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={`mobile-skel-${i}`} className="p-4 space-y-3">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 min-w-0 space-y-2">
                              <Skeleton className="h-4 w-40" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-6 w-20" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : attendanceData.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No attendance records found
                    </div>
                  ) : (
                    attendanceData.map((record, index: number) => (
                      <div key={`mobile-${record.id}-${index}`} className="p-4 space-y-3 border-b last:border-b-0">
                        {/* ... bagian mobile card sama persis, dipersingkat di sini ... */}
                      </div>
                    ))
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="overflow-x-auto w-full">
                  <table className="w-full min-w-[880px]">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="p-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedRecords.length === attendanceData.length && attendanceData.length > 0}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300"
                          />
                        </th>
                        <th className="p-3 text-left text-xs font-medium">Member</th>
                        <th className="p-3 text-left text-xs font-medium">Check In</th>
                        <th className="p-3 text-left text-xs font-medium">Check Out</th>
                        <th className="p-3 text-left text-xs font-medium">Work Hours</th>
                        <th className="p-3 text-left text-xs font-medium">Status</th>
                        <th className="p-3 text-left text-xs font-medium">Method</th>
                        {SHOW_LOCATION ? <th className="p-3 text-left text-xs font-medium">Location</th> : null}
                        <th className="p-3 text-left text-xs font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="[&>tr:nth-child(even)]:bg-muted/50">
                      {(loading || !initialized) ? (
                        <>
                          {Array.from({ length: 6 }).map((_, i) => (
                            <tr key={`table-skel-${i}`} className="border-b">
                              <td className="p-3"><Skeleton className="h-3 w-3 rounded" /></td>
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  <Skeleton className="h-8 w-8 rounded-full" />
                                  <div className="space-y-2">
                                    <Skeleton className="h-3 w-40" />
                                    <Skeleton className="h-2.5 w-24" />
                                  </div>
                                </div>
                              </td>
                              <td className="p-3"><Skeleton className="h-3 w-16" /></td>
                              <td className="p-3"><Skeleton className="h-3 w-16" /></td>
                              <td className="p-3"><Skeleton className="h-3 w-20" /></td>
                              <td className="p-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                              <td className="p-3"><Skeleton className="h-3 w-24" /></td>
                              {SHOW_LOCATION ? <td className="p-3"><Skeleton className="h-3 w-28" /></td> : null}
                              <td className="p-3"><div className="flex items-center gap-1"><Skeleton className="h-8 w-8 rounded" /><Skeleton className="h-8 w-8 rounded" /></div></td>
                            </tr>
                          ))}
                        </>
                      ) : attendanceData.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center py-6 text-muted-foreground text-sm">
                            No attendance records found
                          </td>
                        </tr>
                      ) : (
                        attendanceData.map((record: AttendanceListItem, index: number) => (
                          <tr
                          key={`table-${record.id}-${index}`}
                          style={{ backgroundColor: index % 2 === 1 ? '#f3f4f6' : '#ffffff' }}
                          className={cn("border-b transition-colors cursor-pointer custom-hover-row")}
                        >
                          <td className="p-3">
                              <input
                                type="checkbox"
                                checked={selectedRecords.includes(record.id)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedRecords([...selectedRecords, record.id])
                                  else setSelectedRecords(selectedRecords.filter(id => id !== record.id))
                                }}
                                className="rounded border-gray-300"
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={record.member.avatar} />
                                  <AvatarFallback>{initialsFromName(record.member.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">
                                    <Link href={`/members/${record.member.id ?? ""}`} className="hover:underline">
                                      {record.member.name}
                                    </Link>
                                  </p>
                                  <p className="text-xs text-muted-foreground">{record.member.department}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="font-mono text-xs">
                                {record.checkIn ? formatLocalTime(record.checkIn, userTimezone, "24h", true) : "-"}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="font-mono text-xs">
                                {record.checkOut ? formatLocalTime(record.checkOut, userTimezone, "24h", true) : "-"}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-col gap-1">
                                <span className="font-medium text-xs">{record.workHours}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge className={cn("gap-1 px-2 py-0.5 text-xs", getStatusColor(record.status))}>
                                {getStatusIcon(record.status)}
                                {record.status}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <MethodDisplay checkInMethod={record.checkInMethod} checkOutMethod={record.checkOutMethod} />
                            </td>
                            {SHOW_LOCATION ? (
                              <td className="p-3">
                                <LocationDisplay checkInLocationName={record.checkInLocationName} checkOutLocationName={record.checkOutLocationName} />
                              </td>
                            ) : null}
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" title="Edit" onClick={() => handleEditSingle(record)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDeleteClick(record.id)} className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                {!loading && (
                  <PaginationFooter
                    page={currentPage}
                    totalPages={Math.max(1, Math.ceil((Math.max(totalItems, attendanceData.length) || 0) / itemsPerPage))}
                    onPageChange={(p) => setCurrentPage(Math.max(1, p))}
                    isLoading={loading}
                    from={(Math.max(totalItems, attendanceData.length) > 0) ? (currentPage - 1) * itemsPerPage + 1 : 0}
                    to={(Math.max(totalItems, attendanceData.length) > 0) ? Math.min(currentPage * itemsPerPage, Math.max(totalItems, attendanceData.length)) : 0}
                    total={Math.max(totalItems, attendanceData.length)}
                    pageSize={itemsPerPage}
                    onPageSizeChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
                    pageSizeOptions={[10, 20, 50]}
                  />
                )}
              </CardContent>
            </Card>
        </div>
      )}
    </>
  )
}

export default ModernAttendanceListCloned