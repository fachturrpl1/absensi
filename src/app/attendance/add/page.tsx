"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SingleForm } from "@/components/attendance/add/single-form"
import { BatchForm } from "@/components/attendance/add/batch-form"
import { MemberDialog } from "@/components/attendance/add/dialogs/member-dialog"
import { singleFormSchema, type SingleFormValues } from "@/types/attendance"
import { useRouter } from "next/navigation"
import { useMembers } from "@/hooks/attendance/add/use-members"
import { useBatchAttendance } from "@/hooks/attendance/add/use-batch-attendance"
import { createManualAttendance } from "@/action/attendance"
import { toast } from "sonner"
import { useFormatDate } from "@/hooks/use-format-date"

const parseDateTime = (dateStr: string, timeStr: string): string => {
  return `${dateStr}T${timeStr}:00.000Z`
}

export default function AttendancePage() {
  const router = useRouter()
  
  // Hook ini sekarang akan otomatis menarik timezone dari organisasi yang aktif!
  const { timezone } = useFormatDate()

  const singleForm = useForm<SingleFormValues>({
    resolver: zodResolver(singleFormSchema),
    defaultValues: {
      memberId: "",
      checkInDate: "",
      checkInTime: "",
      checkOutDate: "",
      checkOutTime: "",
      status: "present",
      remarks: ""
    }
  })

  const [selectedMemberId, setSelectedMemberId] = useState<string>("")

  const watchedMemberId = singleForm.watch("memberId")
  useEffect(() => {
    if (watchedMemberId && watchedMemberId !== selectedMemberId) {
      setSelectedMemberId(watchedMemberId)
    }
  }, [watchedMemberId, selectedMemberId])

  const { members, departments, loading: membersLoading } = useMembers()
  const batch = useBatchAttendance()

  const handleSingleSubmit = useCallback(async (values: SingleFormValues) => {
    try {
      const res = await createManualAttendance({
        organization_member_id: values.memberId,
        attendance_date: values.checkInDate,
        actual_check_in: parseDateTime(values.checkInDate, values.checkInTime),
        actual_check_out: values.checkOutDate && values.checkOutTime
          ? parseDateTime(values.checkOutDate, values.checkOutTime)
          : null,
        status: values.status,
        remarks: values.remarks,
        check_in_method: "MANUAL",
        check_out_method: values.checkOutDate ? "MANUAL" : undefined,
        actual_break_start: values.breakStartTime && values.checkInDate
          ? parseDateTime(values.checkInDate, values.breakStartTime)
          : null,
        actual_break_end: values.breakEndTime && values.checkInDate
          ? parseDateTime(values.checkInDate, values.breakEndTime)
          : null,
      })

      if (res.success) {
        toast.success("Attendance record saved")
        singleForm.reset()
        router.push("/attendance")
      } else {
        toast.error(res.message || "Failed to save record")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    }
  }, [singleForm, router])

  const loading = membersLoading || batch.isSubmitting

  return (
    <div className="">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Add Attendance</h1>
      </div>

      <Tabs defaultValue="single" className="w-full mt-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Entry</TabsTrigger>
          <TabsTrigger value="batch">Batch Entry</TabsTrigger>
        </TabsList>

        <SingleForm
          activeTab="single"
          form={singleForm}
          members={members}
          loading={loading}
          singleCheckInDate={singleForm.watch("checkInDate")}
          onSubmit={handleSingleSubmit}
          dialogHandlers={batch}
          selectedMemberId={selectedMemberId}
          onMemberSelect={setSelectedMemberId}
          timezone={timezone} 
        />

        <BatchForm
          onSubmit={async () => { await batch.submitBatch() }}
          onCancel={() => router.back()}
          batch={batch}
        />
      </Tabs>

      <MemberDialog
        members={members}
        departments={departments}
        loading={loading}
        form={singleForm}
        batch={batch}
      />
    </div>
  )
}