"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezonePlugin from "dayjs/plugin/timezone";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  LogIn, LogOut, Coffee, Clock, Search,
  AlertCircle, CheckCircle2, Loader2, CalendarOff,
  RotateCcw, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getMemberSchedule, checkExistingAttendance } from "@/action/attendance";
import type { MemberOption } from "@/types/attendance";
import type { DialogHandlers } from "@/components/attendance/add/dialogs/member-dialog";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

// ----------------------------------------------------------
// Types
// ----------------------------------------------------------
type AttendanceStep = "idle" | "checked_in" | "break_in" | "break_out" | "checked_out";

interface ScheduleRule {
  start_time: string;
  end_time: string;
  break_start?: string | null;
  break_end?: string | null;
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
const parseTimeToMinutes = (time: string | null | undefined): number | null => {
  if (!time) return null;
  const parts = time.split(":").map(Number);
  const hh = parts[0] ?? 0;
  const mm = parts[1] ?? 0;
  return hh * 60 + mm;
};
const currentMinutes = (tz: string) => {
  const now = dayjs().tz(tz);
  return now.hour() * 60 + now.minute();
};

const STEP_ORDER: AttendanceStep[] = ["idle", "checked_in", "break_in", "break_out", "checked_out"];
function stepIndex(step: AttendanceStep) { return STEP_ORDER.indexOf(step); }
function isDone(current: AttendanceStep, target: AttendanceStep) {
  return stepIndex(current) > stepIndex(target);
}

// ----------------------------------------------------------
// Live Clock — compact, inline
// ----------------------------------------------------------
function LiveClock({ timezone }: { timezone: string }) {
  const [time, setTime] = useState(() => dayjs().tz(timezone).format("HH:mm:ss"));
  useEffect(() => {
    const id = setInterval(() => setTime(dayjs().tz(timezone).format("HH:mm:ss")), 1000);
    return () => clearInterval(id);
  }, [timezone]);
  return <span className="font-mono tabular-nums text-sm font-semibold">{time}</span>;
}

// ----------------------------------------------------------
// Compact Action Button — large tap target, minimal text
// ----------------------------------------------------------
interface ActionBtnProps {
  label: string;
  time: string | null;
  icon: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  done: boolean;
  active: boolean; // is this the current step to take?
  tz: string;
}

function ActionBtn({ label, time, icon, onClick, disabled, loading, done, active, tz }: ActionBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading || done}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 transition-all duration-150",
        "w-full h-[88px] sm:h-24",
        "disabled:opacity-35 disabled:cursor-not-allowed disabled:pointer-events-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        done
          ? "border-border bg-muted/40 text-muted-foreground"
          : active
          ? "border-foreground bg-foreground text-background shadow-lg scale-[1.02]"
          : "border-border bg-background text-foreground hover:border-foreground/40 hover:bg-muted/30",
        !disabled && !done && !active && "active:scale-[0.97]",
      )}
    >
      {done && (
        <CheckCircle2 className="absolute top-2 right-2 h-3.5 w-3.5 text-muted-foreground/60" />
      )}
      <span className={cn("transition-all", loading ? "opacity-0" : "opacity-100")}>
        {icon}
      </span>
      {loading && (
        <Loader2 className="absolute h-5 w-5 animate-spin" />
      )}
      <span className="text-[11px] font-semibold tracking-wide uppercase leading-none">
        {label}
      </span>
      {time && (
        <span className="text-[10px] font-mono opacity-60 leading-none">
          {formatTime(time, tz)}
        </span>
      )}
      {!time && !done && active && (
        <span className="text-[10px] opacity-50 leading-none">now</span>
      )}
    </button>
  );
}

// ----------------------------------------------------------
// Member row — compact list item for quick selection
// ----------------------------------------------------------
interface MemberRowProps {
  member: MemberOption;
  isSelected: boolean;
  step: AttendanceStep;
  onClick: () => void;
}
function MemberRow({ member, isSelected, step, onClick }: MemberRowProps) {
  const stepDot = isSelected && step !== "idle" ? (
    <span className={cn(
      "inline-block h-1.5 w-1.5 rounded-full",
      step === "checked_out" ? "bg-green-500" :
      step === "break_in" || step === "break_out" ? "bg-amber-500" :
      "bg-blue-500"
    )} />
  ) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
        isSelected
          ? "bg-foreground text-background"
          : "hover:bg-muted/60 text-foreground",
      )}
    >
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
        isSelected ? "bg-background/20 text-background" : "bg-muted text-foreground",
      )}>
        {member.label.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold truncate leading-tight">{member.label}</p>
        <p className={cn("text-[10px] truncate leading-tight", isSelected ? "opacity-60" : "text-muted-foreground")}>
          {member.department}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {stepDot}
        {isSelected && <ChevronRight className="h-3 w-3 opacity-40" />}
      </div>
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
    checkIn: null, breakIn: null, breakOut: null, checkOut: null,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Sync timestamps ke form parent
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

  // Fetch schedule + cek existing attendance saat member berubah
  useEffect(() => {
    if (!externalMemberId) return;
    setStep("idle");
    setTimestamps({ checkIn: null, breakIn: null, breakOut: null, checkOut: null });
    setSchedule(null);
    setScheduleError(null);
    setIsHoliday(false);

    const init = async () => {
      setScheduleLoading(true);
      const today = todayISO(timezone);
      const [scheduleRes, attendanceRes] = await Promise.all([
        getMemberSchedule(externalMemberId, today),
        checkExistingAttendance(externalMemberId, today),
      ]);
      setScheduleLoading(false);

      if (scheduleRes.success && scheduleRes.data?.start_time) {
        setSchedule(scheduleRes.data as any);
      } else {
        setIsHoliday(true);
        setScheduleError(scheduleRes.message || "Non-working day");
      }

      if (attendanceRes.exists && (attendanceRes as any).data) {
        const r = (attendanceRes as any).data;
        setTimestamps({
          checkIn: r.actual_check_in ?? null,
          breakIn: r.actual_break_start ?? null,
          breakOut: r.actual_break_end ?? null,
          checkOut: r.actual_check_out ?? null,
        });
        if (r.actual_check_out) setStep("checked_out");
        else if (r.actual_break_end) setStep("break_out");
        else if (r.actual_break_start) setStep("break_in");
        else if (r.actual_check_in) setStep("checked_in");
      }
    };
    init();
  }, [externalMemberId, timezone]);

  const isInBreakWindow = useCallback(() => {
    if (!schedule?.break_start || !schedule?.break_end) return false;
    const cur = currentMinutes(timezone);
    const bs = parseTimeToMinutes(schedule.break_start);
    const be = parseTimeToMinutes(schedule.break_end);
    if (bs === null || be === null) return false;
    return cur >= bs && cur <= be;
  }, [schedule, timezone]);

  const handleCheckIn = async () => {
    setActionLoading("checkin");
    const existing = await checkExistingAttendance(externalMemberId, todayISO(timezone));
    if (existing.exists) {
      toast.error("Already checked in today");
      setActionLoading(null);
      return;
    }
    setTimestamps(p => ({ ...p, checkIn: nowISO() }));
    setStep("checked_in");
    toast.success("Check In ✓");
    setActionLoading(null);
  };

  const handleBreakIn = () => {
    setTimestamps(p => ({ ...p, breakIn: nowISO() }));
    setStep("break_in");
    toast.success("Break started");
  };

  const handleBreakOut = () => {
    setTimestamps(p => ({ ...p, breakOut: nowISO() }));
    setStep("break_out");
    toast.success("Break ended");
  };

  const handleCheckOut = () => {
    setTimestamps(p => ({ ...p, checkOut: nowISO() }));
    setStep("checked_out");
    toast.success("Check Out ✓ — click Save to finish");
  };

  const handleReset = () => {
    setStep("idle");
    setTimestamps({ checkIn: null, breakIn: null, breakOut: null, checkOut: null });
    setSchedule(null);
    setScheduleError(null);
    setIsHoliday(false);
    form?.reset();
    dialogHandlers.setMemberDialogOpen(true);
  };

  // Filtered member list for inline search
  const filteredMembers = members.filter(m =>
    m.label.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.department.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const canCheckIn = !isHoliday && step === "idle" && !!externalMemberId && !!schedule;
  const canBreakIn = !isHoliday && step === "checked_in" && !!schedule?.break_start && isInBreakWindow();
  const canBreakOut = !isHoliday && step === "break_in";
  const canCheckOut = !isHoliday && (step === "checked_in" || step === "break_out");

  const selectedMember = members.find(m => m.id === externalMemberId);

  return (
    <TabsContent value="single" asChild>
      {/* 
        Layout: 2 kolom di desktop (member list | action panel)
                1 kolom di mobile (action panel saja, member via dialog)
      */}
      <div className="flex gap-4 min-h-[480px]">

        {/* ── LEFT: Member list (hidden on mobile, shown on md+) ── */}
        <div className="hidden md:flex w-64 shrink-0 flex-col gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search member..."
              value={memberSearch}
              onChange={e => setMemberSearch(e.target.value)}
              className="w-full rounded-xl border bg-background pl-8 pr-3 py-2 text-xs"
            />
          </div>

          {/* Member list */}
          <div className="flex-1 overflow-y-auto space-y-0.5 pr-0.5 max-h-[420px]">
            {filteredMembers.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-8">No members found</p>
            ) : filteredMembers.map(m => (
              <MemberRow
                key={m.id}
                member={m}
                isSelected={m.id === externalMemberId}
                step={m.id === externalMemberId ? step : "idle"}
                onClick={() => {
                  // Simulate MemberDialog selection via form
                  form?.setValue("memberId", m.id, { shouldValidate: true });
                  form?.clearErrors("memberId");
                }}
              />
            ))}
          </div>
        </div>

        {/* ── RIGHT: Action panel ── */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">

          {/* Mobile: member selector button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => dialogHandlers.setMemberDialogOpen(true)}
              className="w-full flex items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3 text-left hover:border-foreground/40 transition-colors"
            >
              {selectedMember ? (
                <>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-xs font-bold">
                    {selectedMember.label.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{selectedMember.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{selectedMember.department}</p>
                  </div>
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Tap to select member...</span>
                </>
              )}
            </button>
          </div>

          {/* Schedule info bar */}
          {externalMemberId && (
            <div className={cn(
              "flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-xs",
              isHoliday ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800" :
              schedule ? "bg-muted/40 border border-border" :
              "bg-muted/20 border border-border"
            )}>
              {scheduleLoading ? (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...
                </span>
              ) : isHoliday ? (
                <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                  <CalendarOff className="h-3.5 w-3.5" /> {scheduleError || "Non-working day"}
                </span>
              ) : schedule ? (
                <span className="flex items-center gap-3 text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium text-foreground">
                      {schedule.start_time?.slice(0, 5)} – {schedule.end_time?.slice(0, 5)}
                    </span>
                  </span>
                  {schedule.break_start && (
                    <span className="flex items-center gap-1">
                      <Coffee className="h-3 w-3" />
                      <span>{schedule.break_start.slice(0, 5)} – {schedule.break_end?.slice(0, 5)}</span>
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
              <span className="flex items-center gap-1 text-muted-foreground shrink-0 ml-auto">
                <LiveClock timezone={timezone} />
              </span>
            </div>
          )}

          {/* No member selected placeholder */}
          {!externalMemberId && (
            <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-12 text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">Select a member</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose from the list on the left or tap search
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="md:hidden gap-2"
                onClick={() => dialogHandlers.setMemberDialogOpen(true)}
              >
                <Search className="h-3.5 w-3.5" /> Select Member
              </Button>
            </div>
          )}

          {/* 4 Action Buttons — main interaction area */}
          {externalMemberId && (
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              <ActionBtn
                label="Check In"
                time={timestamps.checkIn}
                icon={<LogIn className="h-5 w-5" />}
                onClick={handleCheckIn}
                disabled={!canCheckIn}
                loading={actionLoading === "checkin"}
                done={isDone(step, "checked_in")}
                active={step === "idle" && canCheckIn}
                tz={timezone}
              />
              <ActionBtn
                label="Break In"
                time={timestamps.breakIn}
                icon={<Coffee className="h-5 w-5" />}
                onClick={handleBreakIn}
                disabled={!canBreakIn}
                loading={false}
                done={isDone(step, "break_in")}
                active={step === "checked_in" && canBreakIn}
                tz={timezone}
              />
              <ActionBtn
                label="Break Out"
                time={timestamps.breakOut}
                icon={<Coffee className="h-5 w-5" />}
                onClick={handleBreakOut}
                disabled={!canBreakOut}
                loading={false}
                done={isDone(step, "break_out")}
                active={step === "break_in"}
                tz={timezone}
              />
              <ActionBtn
                label="Check Out"
                time={timestamps.checkOut}
                icon={<LogOut className="h-5 w-5" />}
                onClick={handleCheckOut}
                disabled={!canCheckOut}
                loading={false}
                done={isDone(step, "checked_out")}
                active={canCheckOut}
                tz={timezone}
              />
            </div>
          )}

          {/* Step progress — slim bar */}
          {externalMemberId && !isHoliday && (
            <div className="flex gap-1">
              {(["checked_in", "break_in", "break_out", "checked_out"] as const).map((s) => {
                const idx = stepIndex(s);
                const cur = stepIndex(step);
                return (
                  <div key={s} className="flex-1 flex flex-col gap-1">
                    <div className={cn(
                      "h-1 rounded-full transition-all duration-300",
                      cur > idx ? "bg-foreground" : cur === idx ? "bg-foreground/30" : "bg-border"
                    )} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Break window hint */}
          {step === "checked_in" && schedule?.break_start && !isInBreakWindow() && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>Break available <strong>{schedule.break_start.slice(0, 5)} – {schedule.break_end?.slice(0, 5)}</strong></span>
            </div>
          )}

          {/* Notes — only show when active session */}
          {externalMemberId && step !== "idle" && step !== "checked_out" && (
            <Textarea
              value={form?.watch("remarks") || ""}
              onChange={(e) => form?.setValue("remarks", e.target.value)}
              placeholder="Notes (optional)..."
              rows={2}
              className="resize-none text-xs"
            />
          )}

          {/* Done state — next member CTA */}
          {step === "checked_out" && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <span className="font-medium">Done — click <strong>Save</strong> then next member</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="gap-1.5 shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Next
              </Button>
            </div>
          )}

          {/* Holiday state */}
          {isHoliday && externalMemberId && (
            <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
              <CalendarOff className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>All actions disabled — non-working day per schedule.</span>
            </div>
          )}
        </div>
      </div>
    </TabsContent>
  );
}