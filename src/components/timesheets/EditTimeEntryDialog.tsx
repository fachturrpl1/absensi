import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DUMMY_PROJECTS, DUMMY_MEMBERS } from "@/lib/data/dummy-data"
import type { TimeEntry } from "@/lib/data/dummy-data"

interface EditTimeEntryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData?: TimeEntry | null
    onSave: (entry: Partial<TimeEntry>) => void
    isAdmin?: boolean
}

export function EditTimeEntryDialog({
    open,
    onOpenChange,
    initialData,
    onSave,
    isAdmin = true
}: EditTimeEntryDialogProps) {
    const [formData, setFormData] = useState<Partial<TimeEntry>>({
        memberId: "",
        projectId: "",
        taskId: "",
        date: new Date().toISOString().split('T')[0],
        startTime: "09:00",
        endTime: "17:00",
        notes: "",
        source: "manual"
    })

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                startTime: initialData.startTime.slice(0, 5), // HH:mm
                endTime: initialData.endTime.slice(0, 5) // HH:mm
            })
        } else {
            setFormData({
                memberId: DUMMY_MEMBERS[0]?.id || "",
                projectId: "",
                taskId: "",
                date: new Date().toISOString().split('T')[0],
                startTime: "09:00",
                endTime: "17:00",
                notes: "",
                source: "manual"
            })
        }
    }, [initialData, open])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(formData)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Time Entry" : "Add Time Entry"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {isAdmin && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="member" className="text-right">Member</Label>
                            <Select
                                value={formData.memberId}
                                onValueChange={(v) => setFormData({ ...formData, memberId: v })}
                                disabled={!!initialData} // Usually can't change member on edit
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select member" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DUMMY_MEMBERS.map(m => (
                                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="project" className="text-right">Project</Label>
                        <Select
                            value={formData.projectId}
                            onValueChange={(v) => setFormData({ ...formData, projectId: v })}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                            <SelectContent>
                                {DUMMY_PROJECTS.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">Date</Label>
                        <Input
                            id="date"
                            type="date"
                            className="col-span-3"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="start" className="text-right">Start</Label>
                        <div className="col-span-3 flex gap-2 items-center">
                            <Input
                                id="start"
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            />
                            <span>to</span>
                            <Input
                                id="end"
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="notes" className="text-right">Notes</Label>
                        <Textarea
                            id="notes"
                            className="col-span-3"
                            value={formData.notes || ""}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                </form>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" onClick={handleSubmit}>Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
