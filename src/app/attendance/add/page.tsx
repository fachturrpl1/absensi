"use client"

import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
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
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"

// Inisialisasi plugin dayjs
dayjs.extend(utc)
dayjs.extend(timezone)

export default function AttendancePage() {
  const router = useRouter()
  const { timezone: orgTimezone } = useFormatDate()
  const [selectedMemberId, setSelectedMemberId] = useState<string>("")

  const singleForm = useForm<SingleFormValues>({
    resolver: zodResolver(singleFormSchema),
    defaultValues: {
      memberId: "",
      checkInDate: dayjs().tz(orgTimezone).format("YYYY-MM-DD"),
      checkInTime: "",
      status: "present",
      remarks: ""
    }
  })

  // Helper untuk konversi waktu lokal ke UTC ISO String yang dipahami Database
  const formatToISO = (date: string, time: string) => {
    if (!date || !time) return null;
    // Menggabungkan tanggal + jam berdasarkan timezone organisasi, lalu konversi ke UTC
    return dayjs.tz(`${date} ${time}`, orgTimezone).toISOString();
  }

  const { members, departments, loading: membersLoading } = useMembers()
  const batch = useBatchAttendance()

  // Sync internal state dengan react-hook-form
  const watchedMemberId = singleForm.watch("memberId")
  useEffect(() => {
    if (watchedMemberId && watchedMemberId !== selectedMemberId) {
      setSelectedMemberId(watchedMemberId)
    }
  }, [watchedMemberId, selectedMemberId])

  const handleSingleSubmit = useCallback(async (values: SingleFormValues) => {
    try {
      const payload = {
        organization_member_id: values.memberId,
        attendance_date: values.checkInDate,
        actual_check_in: formatToISO(values.checkInDate, values.checkInTime)!,
        actual_check_out: values.checkOutTime 
          ? formatToISO(values.checkOutDate || values.checkInDate, values.checkOutTime) 
          : null,
        actual_break_start: values.breakStartTime 
          ? formatToISO(values.checkInDate, values.breakStartTime) 
          : null,
        actual_break_end: values.breakEndTime 
          ? formatToISO(values.checkInDate, values.breakEndTime) 
          : null,
        status: values.status,
        remarks: values.remarks || "",
        check_in_method: "MANUAL",
        check_out_method: values.checkOutTime ? "MANUAL" : null,
      }

      const res = await createManualAttendance(payload as any)

      if (res.success) {
        toast.success("Attendance record saved successfully")
        router.push("/attendance")
      } else {
        toast.error(res.message || "Failed to save record")
      }
    } catch (error) {
      console.error(error)
      toast.error("An unexpected error occurred")
    }
  }, [orgTimezone, router])

  const loading = membersLoading || batch.isSubmitting

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Add Attendance</h1>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="single">Single Entry</TabsTrigger>
          <TabsTrigger value="batch">Batch Entry</TabsTrigger>
        </TabsList>

        <SingleForm
          activeTab="single"
          form={singleForm}
          members={members}
          loading={loading}
          timezone={orgTimezone}
          dialogHandlers={batch}
          selectedMemberId={selectedMemberId}
          onMemberSelect={setSelectedMemberId}
        />

        <BatchForm
          onSubmit={async () => { await batch.submitBatch() }}
          onCancel={() => router.back()}
          batch={batch}
        />
      </Tabs>

      {/* Action Buttons Global */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={singleForm.handleSubmit(handleSingleSubmit)}
          disabled={loading || !selectedMemberId}
          className="gap-2 min-w-[140px]"
        >
          <Save className="h-4 w-4" />
          {batch.isSubmitting ? "Saving..." : "Save Attendance"}
        </Button>
      </div>

      <MemberDialog
        members={members}
        departments={departments}
        loading={membersLoading}
        form={singleForm}
        batch={batch}
      />
    </div>
  )
}