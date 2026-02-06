import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"
import { Member, Project } from "@/lib/data/dummy-data"

interface TimesheetsFilterSidebarProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    members: Member[]
    projects: Project[]
    onApply: (filters: { memberId: string, projectId: string, source: string, status: string }) => void
}

export function TimesheetsFilterSidebar({
    open,
    onOpenChange,
    members,
    projects,
    onApply
}: TimesheetsFilterSidebarProps) {
    const [memberId, setMemberId] = useState("all")
    const [projectId, setProjectId] = useState("all")
    const [source, setSource] = useState("all")
    const [status, setStatus] = useState("all")

    const handleApply = () => {
        onApply({ memberId, projectId, source, status })
        onOpenChange(false)
    }

    const handleReset = () => {
        setMemberId("all")
        setProjectId("all")
        setSource("all")
        setStatus("all")
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[300px] sm:w-[400px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Filter Timesheets</SheetTitle>
                </SheetHeader>
                <div className="py-6 space-y-6">
                    <div className="space-y-4">
                        <Label>Member</Label>
                        <Select value={memberId} onValueChange={setMemberId}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Members" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Members</SelectItem>
                                {members.map(m => (
                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <Label>Project</Label>
                        <Select value={projectId} onValueChange={setProjectId}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Projects" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Projects</SelectItem>
                                {projects.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <Label>Source</Label>
                        <Select value={source} onValueChange={setSource}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Sources" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sources</SelectItem>
                                <SelectItem value="desktop">Desktop App</SelectItem>
                                <SelectItem value="mobile">Mobile App</SelectItem>
                                <SelectItem value="web">Web Timer</SelectItem>
                                <SelectItem value="manual">Manual Entry</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <Label>Approval Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t flex-row gap-2 justify-end">
                    <Button variant="outline" onClick={handleReset} className="flex-1">Reset</Button>
                    <Button onClick={handleApply} className="flex-1">Apply Filter</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
