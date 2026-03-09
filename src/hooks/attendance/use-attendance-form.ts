"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { singleFormSchema, type SingleFormValues } from "@/types/attendance"

export function useAttendanceForm() {
  const form = useForm<SingleFormValues>({
    resolver: zodResolver(singleFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      memberId: "",
      checkInDate: "",
      checkInTime: "",
      checkOutDate: "",
      checkOutTime: "",
      status: "present",
      remarks: "",
    },
  })

  // Initialize current date/time on mount
  React.useEffect(() => {
    const now = new Date()
    const date = format(now, 'yyyy-MM-dd')
    const time = format(now, 'HH:mm')
    form.reset({
      memberId: "",
      checkInDate: date,
      checkInTime: time,
      checkOutDate: date,
      checkOutTime: time,
      status: "present",
      remarks: "",
    })
  }, [])

  // Sync checkOutDate with checkInDate
  const singleCheckInDate = form.watch('checkInDate')
  React.useEffect(() => {
    form.setValue('checkOutDate', singleCheckInDate || '')
  }, [singleCheckInDate, form.setValue])

  return {
    form,
    singleCheckInDate,
  }
}
