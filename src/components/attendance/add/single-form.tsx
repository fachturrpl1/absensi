"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezonePlugin from "dayjs/plugin/timezone";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  LogIn,
  LogOut,
  Coffee,
  Clock,
  Search,
  AlertCircle,
  CheckCircle2,
  Loader2,
  CalendarOff,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getMemberSchedule,
  checkExistingAttendance,
} from "@/action/attendance";
import type { MemberOption } from "@/types/attendance";
import type { DialogHandlers } from "@/components/attendance/add/dialogs/member-dialog";

// Inisialisasi plugin dayjs
dayjs.extend(utc);
dayjs.extend(timezonePlugin);

// ----------------------------------------------------------
// Types
// ----------------------------------------------------------
type AttendanceStep = "idle" | "checked_in" | "break_in" | "break_out" | "checked_out";

interface ScheduleRule {
  start_time: string;
  end_time: string;
  break_start: string | null | undefined;
  break_end: string | null | undefined;
  day_of_week: number;
}

interface TimestampRecord {
  checkIn: string | null;
  breakIn: string | null;
  breakOut: string | null;
  checkOut: string | null;
}

export interface SingleFormProps {
  activeTab: "single" | "batch";
  members: MemberOption[];
  loading: boolean;
  dialogHandlers: DialogHandlers;
  selectedMemberId?: string;
  onMemberSelect?: (memberId: string) => void;
  timezone: string;
  form?: any;
}

// ----------------------------------------------------------
// Helpers
// ----------------------------------------------------------
const nowISO = () => new Date().toISOString();
const todayISO = (tz: string) => dayjs().tz(tz).format("YYYY-MM-DD");
const formatTime = (iso: string | null, tz: string) => {
  if (!iso) return "--:--";
  return dayjs.utc(iso).tz(tz).format("HH:mm");
};
const parseTimeToMinutes = (time: string | null | undefined) => {
  if (!time) return null;
  const parts = time.split(":").map(Number);
  const hh = parts[0] ?? 0;
  const mm = parts[1] ?? 0;
  return hh * 60 + mm;
};

const currentMinutes = (tz: string): number => {
  const now = dayjs().tz(tz);
  return now.hour() * 60 + now.minute();
};

// ----------------------------------------------------------
// UI Components
// ----------------------------------------------------------
function LiveClock({ timezone }: { timezone: string }) {
  const [time, setTime] = useState(() => dayjs().tz(timezone).format("HH:mm:ss"));
  useEffect(() => {
    const id = setInterval(() => setTime(dayjs().tz(timezone).format("HH:mm:ss")), 1000);
    return () => clearInterval(id);
  }, [timezone]);
  return (
    <div className="flex flex-col items-end">
      <span className="font-mono tabular-nums text-xl font-semibold tracking-tight">{time}</span>
      <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded-md mt-0.5">
        TZ: {timezone}
      </span>
    </div>
  );
}

const STEP_ORDER: AttendanceStep[] = ["idle", "checked_in", "break_in", "break_out", "checked_out"];
const STEP_LABELS: Record<Exclude<AttendanceStep, "idle">, string> = {
  checked_in: "Check In",
  break_in: "Break In",
  break_out: "Break Out",
  checked_out: "Check Out",
};
function stepIndex(step: AttendanceStep): number { return STEP_ORDER.indexOf(step); }

// ----------------------------------------------------------
// Action Button Styled
// ----------------------------------------------------------
const VARIANT_ACTIVE = "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950/40 dark:text-gray-400 dark:hover:bg-gray-950/60";
const VARIANT_DONE = "border-gray-300 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-950/60 dark:text-gray-500";

function ActionButton({ label, sublabel, icon, onClick, disabled, loading, done }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading || done}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-5 transition-all duration-200 w-full",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
        done ? VARIANT_DONE : VARIANT_ACTIVE,
        !disabled && !done && "shadow-sm hover:shadow-md active:scale-[0.98]",
      )}
    >
      {done && <span className="absolute top-2 right-2"><CheckCircle2 className="h-4 w-4" /></span>}
      <span className="text-2xl">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : icon}</span>
      <span className="text-sm font-semibold leading-none">{label}</span>
      {sublabel && <span className="text-[11px] font-normal opacity-70 text-center leading-tight">{sublabel}</span>}
    </button>
  );
}

// ----------------------------------------------------------
// Main Component
// ----------------------------------------------------------
export function SingleForm({
  members,
  loading: _loading,
  dialogHandlers,
  selectedMemberId: externalMemberId = "",
  timezone,
  form,
}: SingleFormProps) {
  const [schedule, setSchedule] = useState<ScheduleRule | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isHoliday, setIsHoliday] = useState(false);
  const [step, setStep] = useState<AttendanceStep>("idle");
  const [timestamps, setTimestamps] = useState<TimestampRecord>({
    checkIn: null, breakIn: null, breakOut: null, checkOut: null
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // LOGIKA SUBMIT: Sinkronisasi ke form parent (WAJIB ADA)
  useEffect(() => {
    if (!form || !externalMemberId) return;
    form.setValue("memberId", externalMemberId);
    form.setValue("checkInDate", todayISO(timezone));
    form.setValue("status", "present");

    if (timestamps.checkIn) form.setValue("checkInTime", formatTime(timestamps.checkIn, timezone));
    if (timestamps.breakIn) form.setValue("breakStartTime", formatTime(timestamps.breakIn, timezone));
    if (timestamps.breakOut) form.setValue("breakEndTime", formatTime(timestamps.breakOut, timezone));
    if (timestamps.checkOut) {
      form.setValue("checkOutDate", todayISO(timezone));
      form.setValue("checkOutTime", formatTime(timestamps.checkOut, timezone));
    }
  }, [timestamps, externalMemberId, form, timezone]);

  useEffect(() => {
    if (!externalMemberId) return;
    setStep("idle");
    setTimestamps({ checkIn: null, breakIn: null, breakOut: null, checkOut: null });
    const fetchSchedule = async () => {
      setScheduleLoading(true);
      const res = await getMemberSchedule(externalMemberId, todayISO(timezone));
      setScheduleLoading(false);
      if (res.success && res.data?.start_time) {
        setSchedule(res.data as any);
        setIsHoliday(false);
        setScheduleError(null);
      } else {
        setIsHoliday(true);
        setScheduleError(res.message || "No schedule found");
      }
    };
    fetchSchedule();
  }, [externalMemberId, timezone]);

  const isInBreakWindow = useCallback(() => {
    if (!schedule?.break_start || !schedule?.break_end) return false;
    const current = currentMinutes(timezone);
    const bStart = parseTimeToMinutes(schedule.break_start);
    const bEnd = parseTimeToMinutes(schedule.break_end);
    if (bStart === null || bEnd === null) return false;
    return current >= bStart && current <= bEnd;
  }, [schedule, timezone]);

  const handleCheckIn = async () => {
    setActionLoading("checkin");
    const existing = await checkExistingAttendance(externalMemberId, todayISO(timezone));
    if (existing.exists) {
      toast.error("Attendance already exists for today");
      setActionLoading(null);
      return;
    }
    setTimestamps(p => ({ ...p, checkIn: nowISO() }));
    setStep("checked_in");
    toast.success("Check In recorded");
    setActionLoading(null);
  };

  const selectedMember = members.find((m) => m.id === externalMemberId);
  const isDone = (targetStep: AttendanceStep) => stepIndex(step) > stepIndex(targetStep);

  return (
    <TabsContent value="single" className="space-y-5">
      {/* ── Member selector ── */}
      <Card className="border shadow-sm">
        <CardContent className="pt-5 pb-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            {selectedMember ? (
              <>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  {selectedMember.label.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{selectedMember.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{selectedMember.department}</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No member selected</p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => dialogHandlers.setMemberDialogOpen(true)} className="shrink-0 gap-2">
            <Search className="h-4 w-4" /> {selectedMember ? "Change Member" : "Select Member"}
          </Button>
        </CardContent>
      </Card>

      {/* ── Schedule info + live clock ── */}
      {externalMemberId && (
        <Card className="border shadow-sm">
          <CardContent className="pt-4 pb-4 flex items-center justify-between">
            {scheduleLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
            ) : isHoliday ? (
              <div className="flex items-center gap-2 text-sm text-amber-600"><CalendarOff className="h-4 w-4 shrink-0" /> <span>{scheduleError}</span></div>
            ) : schedule ? (
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /><span className="font-medium text-foreground">{schedule.start_time?.slice(0, 5)} – {schedule.end_time?.slice(0, 5)}</span></div>
                {schedule.break_start && <div className="flex items-center gap-1.5"><Coffee className="h-3.5 w-3.5" /><span>Break: <span className="font-medium text-foreground">{schedule.break_start.slice(0, 5)} – {schedule.break_end?.slice(0, 5)}</span></span></div>}
              </div>
            ) : null}
            <div className="flex items-center gap-1.5 text-muted-foreground ml-auto">
              <Timer className="h-3.5 w-3.5" />
              <LiveClock timezone={timezone} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step progress bar ── */}
      {externalMemberId && !isHoliday && (
        <div className="flex items-start gap-1 px-1">
          {(Object.keys(STEP_LABELS) as Exclude<AttendanceStep, "idle">[]).map((s, i, arr) => {
            const idx = stepIndex(s);
            const currentIdx = stepIndex(step);
            return (
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={cn("h-1.5 w-full rounded-full transition-all duration-300", currentIdx > idx ? "bg-primary" : currentIdx === idx ? "bg-primary/40" : "bg-muted")} />
                  <span className={cn("mt-1.5 text-[10px] font-medium", currentIdx >= idx ? "text-primary" : "text-muted-foreground")}>{STEP_LABELS[s]}</span>
                </div>
                {i < arr.length - 1 && <div className="w-1 shrink-0" />}
              </div>
            );
          })}
        </div>
      )}

      {/* ── 4 Action buttons ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ActionButton label="Check In" icon={<LogIn className="h-6 w-6" />} onClick={handleCheckIn} done={isDone("checked_in")} disabled={isHoliday || step !== "idle" || !externalMemberId} loading={actionLoading === "checkin"} sublabel={timestamps.checkIn ? formatTime(timestamps.checkIn, timezone) : "Tap to start"} />
        <ActionButton label="Break In" icon={<Coffee className="h-6 w-6" />} onClick={() => { setTimestamps(p => ({ ...p, breakIn: nowISO() })); setStep("break_in"); }} done={isDone("break_in")} disabled={step !== "checked_in" || !isInBreakWindow()} sublabel={timestamps.breakIn ? formatTime(timestamps.breakIn, timezone) : schedule?.break_start ? `From ${schedule.break_start.slice(0, 5)}` : "No break"} />
        <ActionButton label="Break Out" icon={<Coffee className="h-6 w-6" />} onClick={() => { setTimestamps(p => ({ ...p, breakOut: nowISO() })); setStep("break_out"); }} done={isDone("break_out")} disabled={step !== "break_in"} sublabel={timestamps.breakOut ? formatTime(timestamps.breakOut, timezone) : "End break"} />
        <ActionButton label="Check Out" icon={<LogOut className="h-6 w-6" />} onClick={() => { setTimestamps(p => ({ ...p, checkOut: nowISO() })); setStep("checked_out"); }} done={isDone("checked_out")} disabled={step !== "checked_in" && step !== "break_out"} sublabel={timestamps.checkOut ? formatTime(timestamps.checkOut, timezone) : "Tap to finish"} />
      </div>

      {/* ── Timestamp summary ── */}
      {step !== "idle" && (
        <Card className="border shadow-sm bg-muted/30">
          <CardContent className="pt-4 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-sm">
            {[
              { label: "Check In", value: timestamps.checkIn, color: "text-emerald-600 dark:text-emerald-400" },
              { label: "Break In", value: timestamps.breakIn, color: "text-amber-600 dark:text-amber-400" },
              { label: "Break Out", value: timestamps.breakOut, color: "text-blue-600 dark:text-blue-400" },
              { label: "Check Out", value: timestamps.checkOut, color: "text-red-600 dark:text-red-400" },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={cn("font-mono font-semibold tabular-nums", item.value ? item.color : "text-muted-foreground/40")}>{formatTime(item.value, timezone)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Remarks ── */}
      {step !== "idle" && step !== "checked_out" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Notes (Optional)</Label>
          <Textarea value={form?.watch("remarks") || ""} onChange={(e) => form?.setValue("remarks", e.target.value)} placeholder="Add any notes..." rows={2} className="resize-none" />
        </div>
      )}

      {/* ── Hints ── */}
      {step === "checked_in" && schedule?.break_start && !isInBreakWindow() && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Break In available at: <strong>{schedule.break_start.slice(0, 5)} – {schedule.break_end?.slice(0, 5)}</strong></span>
        </div>
      )}

      {step === "checked_out" && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="font-medium">Attendance captured. Click the "Save" button below to finish.</span>
        </div>
      )}
    </TabsContent>
  );
}