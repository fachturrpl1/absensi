"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, differenceInMinutes, parse, isValid, isAfter, isBefore } from "date-fns"
import { Calendar as CalendarIcon, Clock, HelpCircle, Info, Plus, Trash2, Coffee } from "lucide-react"
import { cn } from "@/lib/utils"
import { DUMMY_PROJECTS, DUMMY_MEMBERS, DUMMY_TASKS } from "@/lib/data/dummy-data"
import type { TimeEntry, Break } from "@/lib/data/dummy-data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"

interface EditTimeEntryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData?: TimeEntry | null
    onSave: (entry: Partial<TimeEntry>) => void
    isAdmin?: boolean
}

const REASONS = [
    "Forgot to start timer",
    "Technical issue",
    "Meeting offsite",
    "Correction",
    "Other"
]

export function EditTimeEntryDialog({
    open,
    onOpenChange,
    initialData,
    onSave,
}: EditTimeEntryDialogProps) {
    const [formData, setFormData] = useState<Partial<TimeEntry>>({
        memberId: "",
        projectId: "",
        taskId: "",
        date: new Date().toISOString().split('T')[0],
        startTime: "09:00",
        endTime: "17:00",
        notes: "",
        source: "manual",
        activityPct: 0,
        billable: true,
        reason: "",
        breaks: []
    })

    const [date, setDate] = useState<Date | undefined>(new Date())
    const [touched, setTouched] = useState<Record<string, boolean>>({})
    const [otherReason, setOtherReason] = useState("")
    const [isWorkBreak, setIsWorkBreak] = useState(false)
    const [breaks, setBreaks] = useState<Break[]>([])

    // Derived member state
    const member = DUMMY_MEMBERS.find(m => m.id === formData.memberId)

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                startTime: initialData.startTime.slice(0, 5),
                endTime: initialData.endTime.slice(0, 5),
                taskId: initialData.taskId || "",
                billable: initialData.billable ?? true,
                reason: initialData.reason || ""
            })
            setDate(new Date(initialData.date))
            setBreaks(initialData.breaks || [])

            if (initialData.reason && !REASONS.includes(initialData.reason) && initialData.reason !== "") {
                setFormData(prev => ({ ...prev, reason: "Other" }))
                setOtherReason(initialData.reason)
            } else {
                setOtherReason("")
            }

        } else {
            const today = new Date()
            setFormData({
                memberId: DUMMY_MEMBERS[0]?.id || "",
                projectId: "",
                taskId: "",
                date: today.toISOString().split('T')[0],
                startTime: "09:00",
                endTime: "17:00",
                notes: "",
                source: "manual",
                activityPct: 0,
                billable: true,
                reason: "",
                breaks: []
            })
            setDate(today)
            setBreaks([])
            setOtherReason("")
        }
        setTouched({})
        setIsWorkBreak(false)
    }, [initialData, open])

    useEffect(() => {
        if (date) {
            setFormData(prev => ({ ...prev, date: format(date, "yyyy-MM-dd") }))
        }
    }, [date])

    const calculateDuration = () => {
        if (!formData.startTime || !formData.endTime) return "0:00:00"

        const start = parse(formData.startTime, "HH:mm", new Date())
        const end = parse(formData.endTime, "HH:mm", new Date())

        if (!isValid(start) || !isValid(end)) return "Invalid"

        let diff = differenceInMinutes(end, start)
        if (diff < 0) diff += 24 * 60

        // Subtract breaks
        let breakMinutes = 0
        breaks.forEach(b => {
            const bStart = parse(b.startTime, "HH:mm", new Date())
            const bEnd = parse(b.endTime, "HH:mm", new Date())
            if (isValid(bStart) && isValid(bEnd)) {
                let bDiff = differenceInMinutes(bEnd, bStart)
                if (bDiff > 0) breakMinutes += bDiff
            }
        })

        diff -= breakMinutes
        if (diff < 0) diff = 0 // Should enforce validation instead, but clamp for display

        const hours = Math.floor(diff / 60)
        const minutes = diff % 60
        return `${hours}:${minutes.toString().padStart(2, '0')}:00`
    }

    const isValidTimes = () => {
        if (!formData.startTime || !formData.endTime) return false
        const start = parse(formData.startTime, "HH:mm", new Date())
        const end = parse(formData.endTime, "HH:mm", new Date())
        // Basic check
        if (!isValid(start) || !isValid(end) || start >= end) return false
        return true
    }

    const validateBreaks = () => {
        const start = parse(formData.startTime!, "HH:mm", new Date())
        const end = parse(formData.endTime!, "HH:mm", new Date())

        for (const b of breaks) {
            const bStart = parse(b.startTime, "HH:mm", new Date())
            const bEnd = parse(b.endTime, "HH:mm", new Date())

            if (!isValid(bStart) || !isValid(bEnd) || bStart >= bEnd) return "Invalid break times"
            if (isBefore(bStart, start) || isAfter(bEnd, end)) return "Break must be within work hours"
        }
        return null
    }

    const handleAddBreak = () => {
        setBreaks([...breaks, {
            id: Math.random().toString(),
            startTime: "12:00",
            endTime: "12:30",
            notes: ""
        }])
    }

    const handleRemoveBreak = (id: string) => {
        setBreaks(breaks.filter(b => b.id !== id))
    }

    const handleUpdateBreak = (id: string, field: keyof Break, value: string) => {
        setBreaks(breaks.map(b => b.id === id ? { ...b, [field]: value } : b))
    }

    const handleSave = () => {
        if (!formData.projectId) {
            setTouched(prev => ({ ...prev, projectId: true }))
            return
        }
        if (!isValidTimes()) {
            setTouched(prev => ({ ...prev, time: true }))
            return
        }
        const breakError = validateBreaks()
        if (breakError) {
            // Could show toast or error state
            alert(breakError)
            return
        }

        if (formData.reason === "Other" && !otherReason.trim()) {
            setTouched(prev => ({ ...prev, otherReason: true }))
            return
        }

        const project = DUMMY_PROJECTS.find(p => p.id === formData.projectId)
        const task = DUMMY_TASKS.find(t => t.id === formData.taskId)
        const finalReason = formData.reason === "Other" ? otherReason : formData.reason

        onSave({
            ...formData,
            projectName: project?.name,
            taskId: formData.taskId || undefined,
            taskName: task?.title,
            reason: finalReason,
            duration: calculateDuration(),
            breaks: breaks
        })
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                {/* Custom Header */}
                <div className="flex items-center justify-between p-6 pb-2">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold">Edit time</h2>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                        <HelpCircle className="h-5 w-5 hover:text-gray-600 cursor-pointer" />
                    </div>
                </div>

                {/* User & Toggle */}
                <div className="px-6 pb-4">
                    <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-8 w-8 bg-blue-500 text-white">
                            <AvatarImage src={`https://ui-avatars.com/api/?name=${member?.name || "User"}`} />
                            <AvatarFallback>{member?.name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{member?.name || "User"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={isWorkBreak}
                            onCheckedChange={setIsWorkBreak}
                            id="work-break"
                        />
                        <Label htmlFor="work-break" className="text-sm font-normal text-gray-600">Work break</Label>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-2 grid gap-6 content-start">

                    {/* Project */}
                    <div className="grid gap-1.5">
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Project*</Label>
                        <Select
                            value={formData.projectId}
                            onValueChange={(v) => {
                                setFormData({ ...formData, projectId: v })
                                setTouched(prev => ({ ...prev, projectId: false }))
                            }}
                        >
                            <SelectTrigger className={cn("h-10", touched.projectId && !formData.projectId && "border-destructive")}>
                                <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                            <SelectContent>
                                {DUMMY_PROJECTS.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {touched.projectId && !formData.projectId && (
                            <p className="text-xs text-destructive">Project is required.</p>
                        )}
                    </div>

                    {/* Task */}
                    <div className="grid gap-1.5">
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">To-do</Label>
                        <Select
                            value={formData.taskId || "none"}
                            onValueChange={(v) => setFormData({ ...formData, taskId: v === "none" ? "" : v })}
                        >
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select task" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">-- No Task --</SelectItem>
                                {DUMMY_TASKS.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Time Span */}
                    <div className="grid gap-3">
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Time Span (+07)*</Label>

                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal h-10",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            {date ? format(date, "EEE, MMM d, yyyy") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <span className="text-xs font-semibold text-gray-500 uppercase">From</span>

                            <div className="relative w-32">
                                <Input
                                    type="time"
                                    step="1"
                                    value={formData.startTime}
                                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                    className="pr-8 h-10"
                                />
                                <Clock className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                            </div>

                            <span className="text-xs font-semibold text-gray-500 uppercase">To</span>

                            <div className="relative w-32">
                                <Input
                                    type="time"
                                    step="1"
                                    value={formData.endTime}
                                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                    className="pr-8 h-10"
                                />
                                <Clock className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                            </div>
                        </div>

                        {/* Visual Timeline and Duration Tooltip */}
                        <div className="relative pt-6 pb-2">
                            {/* Tooltip bubble */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-1 bg-white border shadow-sm rounded px-2 py-1 text-sm font-medium text-gray-700 z-10 flex flex-col items-center">
                                {calculateDuration()}
                                <div className="w-2 h-2 bg-white border-r border-b transform rotate-45 absolute -bottom-1"></div>
                            </div>

                            <div className="h-4 bg-gray-200 rounded-full w-full relative overflow-hidden flex">
                                <div className="w-[20%] h-full"></div>
                                <div className="w-[15%] bg-green-400 h-full rounded-l-full"></div>
                                <div className="w-[5%] h-full"></div>
                                <div className="w-[25%] bg-green-400 h-full"></div>
                                <div className="w-[5%] h-full"></div>
                                <div className="w-[30%] bg-gray-200 h-full rounded-r-full"></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-400 mt-1 uppercase px-1">
                                <span>6am</span>
                                <span>6pm</span>
                            </div>
                        </div>
                    </div>

                    {/* Work Breaks Section */}
                    {isWorkBreak && (
                        <div className="grid gap-2 border p-3 rounded-md bg-gray-50">
                            <div className="flex justify-between items-center">
                                <Label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Coffee className="h-3 w-3" /> Breaks</Label>
                                <Button variant="ghost" size="sm" onClick={handleAddBreak} className="h-6 text-xs text-blue-600 gap-1"><Plus className="h-3 w-3" /> Add Break</Button>
                            </div>

                            {breaks.length === 0 && (
                                <p className="text-xs text-gray-400 italic">No breaks added.</p>
                            )}

                            <div className="space-y-2">
                                {breaks.map((b) => (
                                    <div key={b.id} className="flex gap-2 items-center">
                                        <Input
                                            type="time"
                                            className="h-8 w-24 text-xs"
                                            value={b.startTime}
                                            onChange={(e) => handleUpdateBreak(b.id, 'startTime', e.target.value)}
                                        />
                                        <span className="text-xs">-</span>
                                        <Input
                                            type="time"
                                            className="h-8 w-24 text-xs"
                                            value={b.endTime}
                                            onChange={(e) => handleUpdateBreak(b.id, 'endTime', e.target.value)}
                                        />
                                        <Input
                                            placeholder="Notes"
                                            className="h-8 flex-1 text-xs"
                                            value={b.notes || ""}
                                            onChange={(e) => handleUpdateBreak(b.id, 'notes', e.target.value)}
                                        />
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveBreak(b.id)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Billable */}
                    <div className="flex items-center gap-2 mt-2">
                        <Checkbox
                            id="billable"
                            checked={formData.billable}
                            onCheckedChange={(c) => setFormData({ ...formData, billable: c === true })}
                            className="bg-green-500 border-green-500 text-white data-[state=checked]:bg-green-500 data-[state=checked]:text-white"
                        />
                        <Label htmlFor="billable" className="font-normal text-gray-700">Billable</Label>
                        <Info className="h-4 w-4 text-gray-400" />
                    </div>

                    {/* Reason */}
                    <div className="grid gap-1.5 relative">
                        <Label className={cn("text-xs font-bold uppercase tracking-wide", (formData.reason === "Other" && !otherReason) || !formData.reason ? "text-red-500" : "text-gray-500")}>
                            Reason*
                        </Label>
                        <Select
                            value={formData.reason || ""}
                            onValueChange={(v) => {
                                setFormData({ ...formData, reason: v === "none" ? "" : v })
                                if (v !== "Other") setOtherReason("")
                            }}
                        >
                            <SelectTrigger className={cn("h-10", ((formData.reason === "Other" && !otherReason) || (touched.otherReason && !formData.reason)) && "border-destructive")}>
                                <SelectValue placeholder="Why are you editing this time entry?" />
                            </SelectTrigger>
                            <SelectContent>
                                {REASONS.map(r => (
                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {formData.reason === "Other" && (
                            <Input
                                placeholder="Please specify..."
                                value={otherReason}
                                onChange={(e) => {
                                    setOtherReason(e.target.value)
                                    setTouched(prev => ({ ...prev, otherReason: false }))
                                }}
                                className="mt-2"
                            />
                        )}

                        {((formData.reason === "Other" && !otherReason && touched.otherReason) || (!formData.reason && touched.otherReason)) && (
                            <p className="text-xs text-destructive mt-1">can&apos;t be blank</p>
                        )}
                    </div>

                </div>

                <DialogFooter className="p-6 border-t gap-2">
                    <Button variant="outline" className="h-10 px-6" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button className="h-10 px-6 bg-blue-500 hover:bg-blue-600" onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
