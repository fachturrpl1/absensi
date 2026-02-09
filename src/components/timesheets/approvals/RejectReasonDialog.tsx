"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogHeader, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface RejectReasonDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: (reason: string) => void
}

export function RejectReasonDialog({
    open,
    onOpenChange,
    onConfirm
}: RejectReasonDialogProps) {
    const [reason, setReason] = useState("")

    const handleConfirm = () => {
        onConfirm(reason)
        setReason("")
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Reject Timesheet</DialogTitle>
                    <DialogDescription>
                        Please provide a reason for rejecting this timesheet. This will be sent to the member.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="message">Reason</Label>
                        <Textarea
                            id="message"
                            placeholder="Type your reason here."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleConfirm} disabled={!reason.trim()}>Reject</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
