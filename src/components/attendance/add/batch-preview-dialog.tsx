// src/components/attendance/add/batch-preview-dialog.tsx
"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BatchPreviewItem } from "@/hooks/attendance/add/use-batch-attendancev2"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezonePlugin from "dayjs/plugin/timezone"

dayjs.extend(utc)
dayjs.extend(timezonePlugin)

const STATUS_STYLES = {
  present: "bg-emerald-100 text-emerald-700 border-emerald-200",
  late: "bg-amber-100 text-amber-700 border-amber-200",
  absent: "bg-red-100 text-red-700 border-red-200",
}

interface BatchPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: BatchPreviewItem[]
  date: string
  timezone: string
  isSubmitting: boolean
  onToggleItem: (memberId: string) => void
  onUpdateStatus: (memberId: string, status: "present" | "late" | "absent") => void
  onConfirm: () => void
}

export function BatchPreviewDialog({
  open,
  onOpenChange,
  items,
  date,
  timezone,
  isSubmitting,
  onToggleItem,
  onUpdateStatus,
  onConfirm,
}: BatchPreviewDialogProps) {
  const toSave = items.filter((i) => i.include)
  const warnings = items.filter((i) => i.hasWarning && i.include)
  const excluded = items.filter((i) => !i.include)

  const formatTime = (iso: string | null) => {
    if (!iso) return "—"
    return dayjs.utc(iso).tz(timezone).format("HH:mm")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-base font-semibold">
            Preview Batch Attendance
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {date} · {toSave.length} records will be saved
          </p>

          {/* Summary badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline" className="gap-1 text-xs font-normal">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              {toSave.length} ready
            </Badge>
            {warnings.length > 0 && (
              <Badge variant="outline" className="gap-1 text-xs font-normal text-amber-600 border-amber-200 bg-amber-50">
                <AlertCircle className="h-3 w-3" />
                {warnings.length} warning
              </Badge>
            )}
            {excluded.length > 0 && (
              <Badge variant="outline" className="gap-1 text-xs font-normal text-muted-foreground">
                {excluded.length} excluded
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Table */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          <div className="space-y-1">
            {/* Header row */}
            <div className="grid grid-cols-[auto_1fr_80px_80px_100px_32px] gap-2 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span className="w-4" />
              <span>Member</span>
              <span>Check In</span>
              <span>Check Out</span>
              <span>Status</span>
              <span />
            </div>

            {items.map((item) => (
              <div
                key={item.memberId}
                className={cn(
                  "grid grid-cols-[auto_1fr_80px_80px_100px_32px] gap-2 items-center px-2 py-2 rounded-lg transition-colors",
                  item.include ? "bg-background" : "bg-muted/30 opacity-50",
                  item.hasWarning && item.include && "bg-amber-50/50 dark:bg-amber-950/20",
                )}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={item.include}
                  onChange={() => onToggleItem(item.memberId)}
                  className="h-4 w-4 rounded border-border cursor-pointer accent-foreground"
                />

                {/* Member info */}
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate leading-tight">
                    {item.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {item.department}
                    {item.hasWarning && item.warningMessage && (
                      <span className="text-amber-600 ml-1">· {item.warningMessage}</span>
                    )}
                  </p>
                </div>

                {/* Check In */}
                <span className="text-xs font-mono tabular-nums text-center">
                  {formatTime(item.checkIn)}
                </span>

                {/* Check Out */}
                <span className="text-xs font-mono tabular-nums text-center text-muted-foreground">
                  {formatTime(item.checkOut)}
                </span>

                {/* Status select */}
                <Select
                  value={item.status}
                  onValueChange={(v) =>
                    onUpdateStatus(item.memberId, v as any)
                  }
                  disabled={!item.include}
                >
                  <SelectTrigger
                    className={cn(
                      "h-6 text-[10px] font-medium border rounded-full px-2",
                      STATUS_STYLES[item.status],
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present" className="text-xs">Present</SelectItem>
                    <SelectItem value="late" className="text-xs">Late</SelectItem>
                    <SelectItem value="absent" className="text-xs">Absent</SelectItem>
                  </SelectContent>
                </Select>

                {/* Warning icon */}
                <div className="flex items-center justify-center">
                  {item.hasWarning && item.include && (
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0 gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            size="sm"
          >
            Back
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting || toSave.length === 0}
            size="sm"
            className="min-w-[120px] gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              `Save ${toSave.length} Records`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}