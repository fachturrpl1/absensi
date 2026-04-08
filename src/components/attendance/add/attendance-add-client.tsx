"use client"

import { useEffect, useState } from "react"
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
import type { DialogHandlers } from "@/components/attendance/add/dialogs/member-dialog"
import { useFormatDate } from "@/hooks/use-format-date"
import { useOrganizationId } from "@/hooks/use-organization-id"
import { Button } from "@/components/ui/button"
import { FormSkeleton } from "@/components/attendance/add/form-skeleton"

dayjs.extend(utc)
dayjs.extend(timezone)

export function AttendanceAddClient() {
  const router = useRouter()
  const { timezone: orgTimezone } = useFormatDate()
  const { data: organizationId } = useOrganizationId()

  const [isMounted, setIsMounted] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string>("")
  const [activeTab, setActiveTab] = useState<"single" | "batch">("single")

  // State untuk MemberDialog (single mode only)
  const [memberDialogOpen, setMemberDialogOpen] = useState(false)
  const [memberSearch, setMemberSearch] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [activeBatchEntryId, setActiveBatchEntryId] = useState<string | null>(null)

  const singleForm = useForm<SingleFormValues>({
    resolver: zodResolver(singleFormSchema),
    defaultValues: {
      memberId: "",
      checkInDate: dayjs().format("YYYY-MM-DD"),
      checkInTime: "",
      status: "present",
      remarks: ""
    }
  })

  const { members, departments, loading: membersLoading } = useMembers()

  const dialogHandlers: DialogHandlers = {
    memberDialogOpen,
    memberSearch,
    departmentFilter,
    activeBatchEntryId,
    setMemberDialogOpen,
    setMemberSearch,
    setDepartmentFilter,
    setActiveBatchEntryId,
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (organizationId && orgTimezone) {
      singleForm.reset({
        memberId: "",
        checkInDate: dayjs().tz(orgTimezone).format("YYYY-MM-DD"),
        checkInTime: "",
        status: "present",
        remarks: ""
      })
      setSelectedMemberId("")
    }
  }, [organizationId, orgTimezone])

  const watchedMemberId = singleForm.watch("memberId")
  useEffect(() => {
    if (watchedMemberId && watchedMemberId !== selectedMemberId) {
      setSelectedMemberId(watchedMemberId)
    }
  }, [watchedMemberId, selectedMemberId])

  // Tampilkan skeleton jika: belum mount, org belum ada, atau members masih loading
  const isLoading = !isMounted || membersLoading || !organizationId

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Add Attendance</h1>
      </div>

      <div>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "single" | "batch")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="single" disabled={isLoading}>Single Entry</TabsTrigger>
            <TabsTrigger value="batch" disabled={isLoading}>Batch Entry</TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="mt-2">
              <FormSkeleton mode={activeTab} />
            </div>
          ) : (
            <>
              <SingleForm
                activeTab="single"
                form={singleForm}
                members={members}
                loading={false}
                timezone={orgTimezone}
                dialogHandlers={dialogHandlers}
                selectedMemberId={selectedMemberId}
                onMemberSelect={setSelectedMemberId}
              />

              <BatchForm
                members={members}
                timezone={orgTimezone}
                onCancel={() => router.back()}
              />
            </>
          )}
        </Tabs>

        {/* Action Buttons Global */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t mt-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>

        {!isLoading && (
          <MemberDialog
            members={members}
            departments={departments}
            loading={false}
            form={singleForm}
            batch={dialogHandlers}
          />
        )}
      </div>
    </>
  )
}
