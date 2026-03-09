// hooks/attendance/use-batch-attendance.ts
"use client"
import { useEffect, useState, useCallback } from "react"
import { type BatchEntry } from "@/types/attendance"

export function useBatchAttendance() {
  // Master states
  const [batchCheckInDate, setBatchCheckInDate] = useState("")
  const [batchCheckInTime, setBatchCheckInTime] = useState("08:00")
  const [batchCheckOutDate, setBatchCheckOutDate] = useState("")
  const [batchCheckOutTime, setBatchCheckOutTime] = useState("")
  const [batchStatus, setBatchStatus] = useState("present")
  const [batchRemarks, setBatchRemarks] = useState("")
  
  // Batch states
  const [batchEntries, setBatchEntries] = useState<BatchEntry[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [memberDialogOpen, setMemberDialogOpen] = useState(false)
  const [activeBatchEntryId, setActiveBatchEntryId] = useState<string | null>(null)
  const [memberSearch, setMemberSearch] = useState("")

  // Initialize dates
  useEffect(() => {
    const now = new Date()
    const date = now.toISOString().slice(0, 10)
    const time = now.toTimeString().slice(0, 5)
    setBatchCheckInDate(date)
    setBatchCheckInTime(time)
    setBatchCheckOutDate(date)
  }, [])

  // Sync checkout date
  useEffect(() => {
    setBatchCheckOutDate(batchCheckInDate)
  }, [batchCheckInDate])

  const addBatchEntry = useCallback((memberId?: string) => {
    const newEntry: BatchEntry = {
      id: Date.now().toString(),
      memberId: memberId || "",
      checkInDate: batchCheckInDate,
      checkInTime: batchCheckInTime,
      checkOutDate: batchCheckOutDate,
      checkOutTime: batchCheckOutTime,
      status: batchStatus,
      remarks: batchRemarks,
    }
    setBatchEntries(prev => [...prev, newEntry])
  }, [batchCheckInDate, batchCheckInTime, batchCheckOutDate, batchCheckOutTime, batchStatus, batchRemarks])

  const updateBatchEntry = useCallback((id: string, field: string, value: string) => {
    setBatchEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ))
  }, [])

  const removeBatchEntry = useCallback((id: string) => {
    setBatchEntries(prev => prev.filter(e => e.id !== id))
  }, [])

  return {
    batchEntries, addBatchEntry, updateBatchEntry, removeBatchEntry,
    batchCheckInDate, setBatchCheckInDate, batchCheckInTime, setBatchCheckInTime,
    batchCheckOutDate, batchCheckOutTime, setBatchCheckOutTime,
    batchStatus, setBatchStatus, batchRemarks, setBatchRemarks,
    isSubmitting, setIsSubmitting,
    departmentFilter, setDepartmentFilter,
    memberDialogOpen, setMemberDialogOpen,
    activeBatchEntryId, setActiveBatchEntryId,
    memberSearch, setMemberSearch
  }
}
