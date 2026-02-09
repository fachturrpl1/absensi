"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { DUMMY_TIME_ENTRIES } from "@/lib/data/dummy-data"
import type { TimesheetApproval } from "@/lib/data/dummy-data"
import { Badge } from "@/components/ui/badge"

interface ApprovalDetailDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    approval: TimesheetApproval | null
    onApprove: (id: string) => void
    onReject: (id: string) => void
}

export function ApprovalDetailDialog({
    open,
    onOpenChange,
    approval,
    onApprove,
    onReject
}: ApprovalDetailDialogProps) {
    if (!approval) return null

    // Simulate fetching entries for this period/member
    // In a real app, this would be an API call based on approval.memberId, dateStart, dateEnd
    const entries = DUMMY_TIME_ENTRIES.filter(e => e.memberId === approval.memberId)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-center justify-between mr-8">
                        <div>
                            <DialogTitle className="text-xl">Timesheet Details</DialogTitle>
                            <DialogDescription>
                                {approval.memberName} • {format(new Date(approval.dateStart), "MMM d")} - {format(new Date(approval.dateEnd), "MMM d, yyyy")}
                            </DialogDescription>
                        </div>
                        <div className="flex gap-2">
                            <Badge variant="outline" className="capitalize">
                                {approval.status}
                            </Badge>
                            <div className="text-sm text-muted-foreground">
                                Total: {approval.totalHours}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto border rounded-md">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted text-muted-foreground sticky top-0">
                            <tr>
                                <th className="p-3 font-medium">Date</th>
                                <th className="p-3 font-medium">Project</th>
                                <th className="p-3 font-medium">Task</th>
                                <th className="p-3 font-medium">Time</th>
                                <th className="p-3 font-medium">Duration</th>
                                <th className="p-3 font-medium">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {entries.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-4 text-center text-muted-foreground">No time entries found for this period.</td>
                                </tr>
                            ) : (
                                entries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-muted/50">
                                        <td className="p-3">{format(new Date(entry.date), "MMM d, yyyy")}</td>
                                        <td className="p-3 font-medium">{entry.projectName}</td>
                                        <td className="p-3">{entry.taskName || "-"}</td>
                                        <td className="p-3 text-xs text-muted-foreground">
                                            {entry.startTime} - {entry.endTime}
                                        </td>
                                        <td className="p-3 font-mono">{entry.duration}</td>
                                        <td className="p-3 text-muted-foreground italic max-w-xs truncate" title={entry.notes}>
                                            {entry.notes || "-"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                    {approval.status === 'pending' && (
                        <>
                            <Button variant="destructive" onClick={() => onReject(approval.id)}>Reject</Button>
                            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => onApprove(approval.id)}>Approve</Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
