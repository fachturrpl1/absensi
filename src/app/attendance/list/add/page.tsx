"use client"

import { Loader2, X, Search, Plus, Minus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAttendanceForm } from "@/hooks/attendance/use-attendance-form"
import { useQueryClient } from "@tanstack/react-query"
import { createManualAttendance } from "@/action/attendance"
import { toTimestampWithTimezone } from "@/lib/timezone"
import { useBatchAttendance } from "@/hooks/attendance/use-batch-attendance"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import {
    type AttendanceEntry,
    SingleFormValues,
    QUICK_STATUSES,
} from "@/types/attendance"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useMembers } from "@/hooks/attendance/use-members"
import { bulkCreateAttendance } from "@/action/attendance"

export default function AddAttendancePage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const { form, singleCheckInDate } = useAttendanceForm()
    const { members, departments, loading } = useMembers()
    const [ activeTab, setActiveTab ] = useState("single")
    const {
        batchEntries, addBatchEntry, updateBatchEntry, removeBatchEntry,
        batchCheckInDate, setBatchCheckInDate,
        batchCheckInTime, setBatchCheckInTime,
        batchCheckOutTime, setBatchCheckOutTime,
        batchStatus, setBatchStatus,
        batchRemarks, setBatchRemarks,
        departmentFilter, setDepartmentFilter,
        memberDialogOpen, setMemberDialogOpen,
        activeBatchEntryId, setActiveBatchEntryId,
        memberSearch, setMemberSearch,
        isSubmitting, setIsSubmitting
    } = useBatchAttendance()

    // Parse date and time to DateTime
    const parseDateTime = (dateStr: string, timeStr: string): Date => {
        const [year, month, day] = dateStr.split("-")
        const [hour, minute] = timeStr.split(":")
        return new Date(
            Number(year),
            Number(month) - 1,
            Number(day),
            Number(hour),
            Number(minute),
            0,
            0
        )
    }

    // Single Mode Submit
    const onSubmitSingle = async (values: SingleFormValues) => {
        try {
            const checkInDateTime = parseDateTime(values.checkInDate, values.checkInTime)
            const checkOutDateTime = values.checkOutDate && values.checkOutTime
                ? parseDateTime(values.checkOutDate, values.checkOutTime)
                : null

            // Validate: check-out must not be earlier than check-in
            if (checkOutDateTime && checkOutDateTime < checkInDateTime) {
                toast.error("Check-out cannot be earlier than check-in")
                return
            }

            const payload: AttendanceEntry = {
                organization_member_id: values.memberId,
                attendance_date: values.checkInDate,
                actual_check_in: toTimestampWithTimezone(checkInDateTime),
                actual_check_out: checkOutDateTime ? toTimestampWithTimezone(checkOutDateTime) : null,
                status: values.status,
                remarks: values.remarks?.trim() || undefined,
                check_in_method: "MANUAL",
                check_out_method: checkOutDateTime ? "MANUAL" : undefined,
            }

            const res = await createManualAttendance(payload)

            if (res.success) {
                // Invalidate all dashboard-related queries to refresh data
                await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
                toast.success("Attendance recorded successfully")
                router.push("/attendance/list")
            } else {
                toast.error(res.message || "Failed to save attendance")
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "An error occurred"
            toast.error(message)
        }
    }

    // Batch Mode: Submit All
    const onSubmitBatch = async () => {
        if (batchEntries.length === 0) {
            toast.error("Please add at least one attendance record")
            return
        }

        // Validate all entries
        const invalidEntries: string[] = []
        const invalidTimeEntries: string[] = []
        for (const [i, entry] of batchEntries.entries()) {
            if (!entry.memberId || !entry.checkInDate || !entry.checkInTime) {
                const selectedMember = members.find((m) => m.id === entry.memberId)
                const memberName = selectedMember?.label || `Entry ${i + 1}`
                invalidEntries.push(memberName)
            }

            // Validate time ordering per entry when check-out provided
            const hasOut = Boolean(entry.checkOutDate && entry.checkOutTime)
            if (hasOut) {
                const inDT = parseDateTime(entry.checkInDate, entry.checkInTime)
                const outDT = parseDateTime(entry.checkOutDate!, entry.checkOutTime!)
                if (outDT < inDT) {
                    const selectedMember = members.find((m) => m.id === entry.memberId)
                    const memberName = selectedMember?.label || `Entry ${i + 1}`
                    invalidTimeEntries.push(memberName)
                }
            }
        }

        if (invalidEntries.length > 0) {
            toast.error(`Incomplete entries: ${invalidEntries.slice(0, 3).join(", ")}${invalidEntries.length > 3 ? ` and ${invalidEntries.length - 3} more` : ""}`)
            return
        }

        if (invalidTimeEntries.length > 0) {
            toast.error(`Time is not valid: ${invalidTimeEntries.slice(0, 3).join(", ")}${invalidTimeEntries.length > 3 ? ` and ${invalidTimeEntries.length - 3} more` : ""}`)
            return
        }

        // Check for duplicates within batch itself
        const duplicateCheck = new Map<string, string[]>()
        for (const entry of batchEntries) {
            // use a safe delimiter that won't appear in IDs or date
            const key = `${entry.memberId}::${entry.checkInDate}`
            if (!duplicateCheck.has(key)) {
                duplicateCheck.set(key, [])
            }
            duplicateCheck.get(key)!.push(entry.memberId)
        }

        for (const [key, memberIds] of duplicateCheck.entries()) {
            if (memberIds.length > 1) {
                const [memberId, date] = key.split("::")
                const selectedMember = members.find((m) => m.id === memberId)
                const memberName = selectedMember?.label || `Member ${memberId}`
                toast.error(`${memberName} has duplicate entries for ${date}`)
                return
            }
        }

        try {
            setIsSubmitting(true)
            
            // 1 BULK CALL!
            const bulkPayload: AttendanceEntry[] = batchEntries.map(entry => ({
                organization_member_id: entry.memberId,
                attendance_date: entry.checkInDate,
                actual_check_in: toTimestampWithTimezone(parseDateTime(entry.checkInDate, entry.checkInTime)),
                actual_check_out: entry.checkOutDate && entry.checkOutTime 
                    ? toTimestampWithTimezone(parseDateTime(entry.checkOutDate, entry.checkOutTime))
                    : null,
                status: entry.status || batchStatus,
                remarks: entry.remarks || batchRemarks || undefined,
                check_in_method: "MANUAL",
                check_out_method: entry.checkOutDate && entry.checkOutTime ? "MANUAL" : undefined,
            }))

            // GUNAKAN NAMA BENAR:
            const res = await bulkCreateAttendance(bulkPayload)  // Bukan createBulkManualAttendance

            if (res.success) {
            await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
            toast.success(`${res.count} records saved! ⚡`)
            router.push("/attendance/list")
            }
        } catch (error) {
            toast.error("Bulk save failed")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-4 w-full">
            <div className="w-full">
                <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 md:p-6 space-y-6 overflow-x-auto">
                        <div className="space-y-6">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="single">Single Entry</TabsTrigger>
                                    <TabsTrigger value="batch">Batch Entry</TabsTrigger>
                                </TabsList>

                                {/* SINGLE MODE */}
                                <TabsContent value="single" className="space-y-6">
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmitSingle)} className="space-y-6">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Add Single Attendance</CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-6">

                                                    {/* Member Selection */}
                                                    <FormField
                                                        control={form.control}
                                                        name="memberId"
                                                        render={({ field }) => {
                                                            const selectedMember = members.find(m => m.id === field.value);

                                                            return (
                                                                <FormItem className="flex flex-col">
                                                                    <FormControl>
                                                                        {/* Hidden input to properly register the field with RHF and keep it a string */}
                                                                        <input type="hidden" {...field} />
                                                                    </FormControl>
                                                                    <FormLabel>Select Member *</FormLabel>
                                                                    <Button
                                                                        variant="outline"
                                                                        role="combobox"
                                                                        className={`w-full justify-between font-normal ${!field.value && "text-muted-foreground"}`}
                                                                        disabled={loading}
                                                                        onClick={() => {
                                                                            setActiveBatchEntryId(null);
                                                                            setMemberDialogOpen(true);
                                                                        }}
                                                                    >
                                                                        {selectedMember ? `${selectedMember.label} (${selectedMember.department})` : "Choose a member..."}
                                                                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                    </Button>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )
                                                        }}
                                                    />

                                                    {/* Check-in */}
                                                    <div className="space-y-3">
                                                        <FormLabel>Check-in Date & Time *</FormLabel>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <FormField
                                                                control={form.control}
                                                                name="checkInDate"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel className="text-sm">Date</FormLabel>
                                                                        <FormControl>
                                                                            <Input type="date" {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <FormField
                                                                control={form.control}
                                                                name="checkInTime"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel className="text-sm">Time</FormLabel>
                                                                        <FormControl>
                                                                            <Input type="time" {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Check-out */}
                                                    <div className="space-y-3">
                                                        <FormLabel>Check-out Date & Time</FormLabel>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <FormField
                                                                control={form.control}
                                                                name="checkOutDate"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel className="text-sm">Date</FormLabel>
                                                                        <FormControl>
                                                                            <Input
                                                                                type="date"
                                                                                {...field}
                                                                                value={singleCheckInDate || ""}  // Paksa value dari checkInDate
                                                                                onChange={(e) => {
                                                                                    field.onChange(e); // Tetap trigger RHF
                                                                                }}
                                                                                disabled  // Tetap disabled
                                                                            />
                                                                        </FormControl>
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <FormField
                                                                control={form.control}
                                                                name="checkOutTime"
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel className="text-sm">Time</FormLabel>
                                                                        <FormControl>
                                                                            <Input type="time" {...field} value={field.value ?? ""} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Status Selection */}
                                                    <FormField
                                                        control={form.control}
                                                        name="status"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Status *</FormLabel>
                                                                <Select
                                                                    disabled={form.formState.isSubmitting}
                                                                    onValueChange={field.onChange}
                                                                    value={field.value}
                                                                >
                                                                    <FormControl>
                                                                        <SelectTrigger className="w-full md:w-1/2">
                                                                            <SelectValue placeholder="Select status" />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        {QUICK_STATUSES.map((status) => (
                                                                            <SelectItem key={status.value} value={status.value}>
                                                                                <div className="flex items-center">
                                                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
                                                                                        {status.label}
                                                                                    </span>
                                                                                </div>
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {/* Remarks */}
                                                    <FormField
                                                        control={form.control}
                                                        name="remarks"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Notes (Optional)</FormLabel>
                                                                <FormControl>
                                                                    <Textarea
                                                                        placeholder="Add any notes..."
                                                                        rows={3}
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormDescription>Max 500 characters</FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </CardContent>
                                            </Card>

                                            <div className="flex justify-end gap-3">
                                                <Button type="button" variant="outline" onClick={() => router.back()}>
                                                    <X className="mr-2 h-4 w-4" /> Cancel
                                                </Button>
                                                <Button type="submit" disabled={form.formState.isSubmitting}>
                                                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Save
                                                </Button>
                                            </div>
                                        </form>
                                    </Form>
                                </TabsContent>

                                {/* BATCH MODE */}
                                <TabsContent value="batch" className="space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Add Batch Attendance</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">

                                            {/* Master Date & Time for Batch Entries */}
                                            <div className="space-y-3">
                                                <label className="text-sm font-medium">Batch Date & Time</label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-xs text-muted-foreground">Check-in Date</label>
                                                            <Input type="date" value={batchCheckInDate} onChange={(e) => setBatchCheckInDate(e.target.value)} />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-muted-foreground">Check-in Time</label>
                                                            <Input type="time" value={batchCheckInTime} onChange={(e) => setBatchCheckInTime(e.target.value)} />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-xs text-muted-foreground">Check-out Date</label>
                                                            <Input type="date" value={batchCheckInDate} disabled placeholder="Follows check-in date" />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-muted-foreground">Check-out Time </label>
                                                            <Input type="time" value={batchCheckOutTime} onChange={(e) => setBatchCheckOutTime(e.target.value)} placeholder="Optional" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Master Status & Notes for Batch Entries */}
                                            <div className="space-y-3">
                                                <label className="text-sm font-medium">Batch Status & Notes</label>
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-xs text-muted-foreground block mb-2">Status</label>
                                                        <Select
                                                            disabled={isSubmitting}
                                                            onValueChange={setBatchStatus}
                                                            value={batchStatus}
                                                        >
                                                            <SelectTrigger className="w-full md:w-1/2">
                                                                <SelectValue placeholder="Select status" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {QUICK_STATUSES.map((st) => (
                                                                    <SelectItem key={st.value} value={st.value}>
                                                                        <div className="flex items-center">
                                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${st.color}`}>
                                                                                {st.label}
                                                                            </span>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-muted-foreground block mb-2">Notes</label>
                                                        <Textarea
                                                            placeholder="Add notes for all selected members..."
                                                            rows={2}
                                                            value={batchRemarks}
                                                            onChange={(e) => setBatchRemarks(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Quick Add Buttons */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-sm font-medium">Quick Add Members</label>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => addBatchEntry()}
                                                        disabled={isSubmitting}
                                                    >
                                                        <Plus className="mr-1 h-3 w-3" />
                                                        Add Empty Entry
                                                    </Button>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="relative pb-1">
                                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            placeholder="Search member to add..."
                                                            value={memberSearch}
                                                            onChange={(e) => setMemberSearch(e.target.value)}
                                                            className="pl-8 pb-2"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto pt-2">
                                                        {members.filter(m =>
                                                            m.label.toLowerCase().includes(memberSearch.toLowerCase()) ||
                                                            m.department.toLowerCase().includes(memberSearch.toLowerCase())
                                                        ).map((member) => (
                                                            <Button
                                                                key={member.id}
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    const exists = batchEntries.some((e) => e.memberId === member.id)
                                                                    if (!exists) {
                                                                        addBatchEntry(member.id)

                                                                    } else {
                                                                        toast.info(`${member.label} already in batch`)
                                                                    }
                                                                }}
                                                                disabled={isSubmitting}
                                                                className="text-left truncate"
                                                            >
                                                                <Plus className="mr-1 h-3 w-3" />
                                                                <span className="truncate text-xs">{member.label}</span>
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Batch Entries List */}
                                            <div className="space-y-3">
                                                <label className="text-sm font-medium block">
                                                    Attendance Records ({batchEntries.length})
                                                </label>

                                                {batchEntries.length === 0 ? (
                                                    <div className="text-center py-8 text-muted-foreground border rounded-lg">
                                                        No entries yet. Click "Add Empty Entry" or quick add a member above.
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto pt-2">
                                                        {batchEntries.map((entry) => {
                                                            const selectedMember = members.find((m) => m.id === entry.memberId)
                                                            return (
                                                                <Button
                                                                    key={entry.id}
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        removeBatchEntry(entry.id)
                                                                    }}
                                                                    disabled={isSubmitting}
                                                                    className="text-left truncate"
                                                                >
                                                                    <Minus className="mr-1 h-3 w-3" />
                                                                    <span className="truncate text-xs">{selectedMember ? selectedMember.label : 'Select member...'}</span>
                                                                </Button>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Batch Submit */}
                                    <div className="flex justify-end gap-3">
                                        <Button type="button" variant="outline" onClick={() => router.back()}>
                                            <X className="mr-2 h-4 w-4" /> Cancel
                                        </Button>
                                        <Button
                                            onClick={onSubmitBatch}
                                            disabled={isSubmitting || batchEntries.length === 0}
                                        >
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Save {batchEntries.length} Records
                                        </Button>
                                    </div>
                                </TabsContent>
                            </Tabs>

                            {/* Shared Member Selection Dialog */}
                            <Dialog open={memberDialogOpen} onOpenChange={(open) => {
                                setMemberDialogOpen(open);
                                if (!open) {
                                    setMemberSearch("");
                                    setActiveBatchEntryId(null);
                                }
                            }}>
                                <DialogContent className="max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Select Member</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium gap-2">Filter by Department</label>
                                            <Select value={departmentFilter} onValueChange={setDepartmentFilter} disabled={loading}>
                                                <SelectTrigger className="w-full pt-2">
                                                    <SelectValue placeholder="All Groups" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Groups</SelectItem>
                                                    {departments.map((name) => (
                                                        <SelectItem key={name} value={name}>
                                                            {name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="relative">
                                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search member name or department..."
                                                value={memberSearch}
                                                onChange={(e) => setMemberSearch(e.target.value)}
                                                className="pl-8"
                                            />
                                        </div>
                                        <div className="max-h-72 overflow-y-auto space-y-1">
                                            {(departmentFilter === "all"
                                                ? members
                                                : members.filter((m) => m.department === departmentFilter)
                                            ).filter(m =>
                                                m.label.toLowerCase().includes(memberSearch.toLowerCase()) ||
                                                m.department.toLowerCase().includes(memberSearch.toLowerCase())
                                            ).length > 0 ? (
                                                (departmentFilter === "all"
                                                    ? members
                                                    : members.filter((m) => m.department === departmentFilter)
                                                ).filter(m =>
                                                    m.label.toLowerCase().includes(memberSearch.toLowerCase()) ||
                                                    m.department.toLowerCase().includes(memberSearch.toLowerCase())
                                                ).map((member) => (
                                                    <Button
                                                        key={member.id}
                                                        variant="ghost"
                                                        className="w-full justify-start text-left font-normal h-auto py-2"
                                                        onClick={() => {
                                                            if (activeBatchEntryId) {
                                                                updateBatchEntry(activeBatchEntryId, "memberId", member.id);
                                                            } else {
                                                                form.setValue("memberId", member.id, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                                                                form.clearErrors("memberId");
                                                                form.trigger("memberId");
                                                            }
                                                            setMemberDialogOpen(false);
                                                            setMemberSearch("");
                                                            setActiveBatchEntryId(null);
                                                        }}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span>{member.label}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {member.department}
                                                            </span>
                                                        </div>
                                                    </Button>
                                                ))
                                            ) : (
                                                <div className="px-2 py-4 text-sm text-center text-muted-foreground">
                                                    {loading ? "Loading..." : "No members found"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
