/**
 * Attendance Status Calculator
 * 
 * Deterministic, auditable attendance status classification based on:
 * - Core hours (mandatory working window)
 * - Grace periods (tolerance before late/early leave)
 * - Day of week rules (0=Sunday, 1=Monday, ..., 6=Saturday)
 * 
 * Status Logic:
 * | Time Condition                           | Status  | present |
 * |------------------------------------------|---------|---------|
 * | Check-in before core_hours_start         | PRESENT | true    |
 * | Check-in within core hours (after grace) | LATE    | true    |
 * | Check-out after core_hours_end           | LEAVE   | true    |
 * | Any invalid condition                    | ABSENT  | false   |
 * 
 * Invalid conditions:
 * - start_time >= core_hours_start (configuration error)
 * - end_time <= core_hours_end (configuration error)
 * - Missing check-in or check-out
 */

export type AttendanceStatus = 'present' | 'late' | 'leave' | 'absent' | 'early_leave';

export interface AttendanceStatusResult {
    status: AttendanceStatus;
    present: boolean;
    details: {
        lateMinutes?: number;
        earlyLeaveMinutes?: number;
        isWithinGrace?: boolean;
    };
}

export interface ScheduleRule {
    day_of_week: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
    start_time: string; // HH:MM - Check-in window opens
    end_time: string; // HH:MM - Check-out window closes
    core_hours_start: string; // HH:MM - Core hours begin
    core_hours_end: string; // HH:MM - Core hours end
    grace_in_minutes: number; // Tolerance for late arrival
    grace_out_minutes: number; // Tolerance for early departure
}

/**
 * Convert HH:MM or HH:MM:SS time string to minutes since midnight
 */
function timeToMinutes(time: string | null | undefined): number | null {
    if (!time) return null;
    const parts = time.split(':').map(Number);
    if (parts.some(isNaN)) return null;
    const [hh = 0, mm = 0] = parts;
    return hh * 60 + mm;
}

/**
 * Validate schedule rule configuration
 * Returns error message if invalid, null if valid
 */
export function validateScheduleRule(rule: ScheduleRule): string | null {
    const startTime = timeToMinutes(rule.start_time);
    const endTime = timeToMinutes(rule.end_time);
    const coreStart = timeToMinutes(rule.core_hours_start);
    const coreEnd = timeToMinutes(rule.core_hours_end);

    if (startTime === null || endTime === null || coreStart === null || coreEnd === null) {
        return 'All time fields are required';
    }

    if (coreEnd <= coreStart) {
        return 'core_hours_end must be later than core_hours_start';
    }

    if (startTime >= coreStart) {
        return 'start_time must be earlier than core_hours_start';
    }

    if (endTime <= coreEnd) {
        return 'end_time must be later than core_hours_end';
    }

    return null;
}

/**
 * Calculate attendance status based on actual check-in/out times and schedule rules
 * 
 * @param actualCheckIn - Actual check-in time (HH:MM or HH:MM:SS)
 * @param actualCheckOut - Actual check-out time (HH:MM or HH:MM:SS)
 * @param rule - Schedule rule for the day
 * @returns Attendance status result with details
 */
export function calculateAttendanceStatus(
    actualCheckIn: string | null | undefined,
    actualCheckOut: string | null | undefined,
    rule: ScheduleRule
): AttendanceStatusResult {
    // Default result for invalid cases
    const absentResult: AttendanceStatusResult = {
        status: 'absent',
        present: false,
        details: {},
    };

    // Validate rule configuration
    const validationError = validateScheduleRule(rule);
    if (validationError) {
        return absentResult;
    }

    // Parse times
    const checkIn = timeToMinutes(actualCheckIn);
    const checkOut = timeToMinutes(actualCheckOut);
    const coreStart = timeToMinutes(rule.core_hours_start)!;
    const coreEnd = timeToMinutes(rule.core_hours_end)!;
    const graceIn = rule.grace_in_minutes || 0;
    const graceOut = rule.grace_out_minutes || 0;

    // Invalid: Missing check-in or check-out
    if (checkIn === null || checkOut === null) {
        return absentResult;
    }

    // Calculate effective thresholds with grace periods
    const lateThreshold = coreStart + graceIn;
    const earlyLeaveThreshold = coreEnd - graceOut;

    // Determine check-in status
    let lateMinutes = 0;
    let isLate = false;
    let isWithinGrace = false;

    if (checkIn <= coreStart) {
        // PRESENT: Checked in before or exactly at core hours start
        isLate = false;
    } else if (checkIn <= lateThreshold) {
        // Within grace period - technically late but tolerated
        isLate = false;
        isWithinGrace = true;
        lateMinutes = checkIn - coreStart;
    } else {
        // LATE: Checked in after grace period
        isLate = true;
        lateMinutes = checkIn - coreStart;
    }

    // Determine check-out status
    let earlyLeaveMinutes = 0;
    let isEarlyLeave = false;

    if (checkOut >= coreEnd) {
        // Checked out after core hours end - OK
        isEarlyLeave = false;
    } else if (checkOut >= earlyLeaveThreshold) {
        // Within grace period - technically early but tolerated
        isEarlyLeave = false;
        earlyLeaveMinutes = coreEnd - checkOut;
    } else {
        // EARLY LEAVE: Left before grace period threshold
        isEarlyLeave = true;
        earlyLeaveMinutes = coreEnd - checkOut;
    }

    // Determine final status
    // Priority: absent > late > early_leave > present
    if (isLate && isEarlyLeave) {
        // Both late AND early leave
        return {
            status: 'late',
            present: true,
            details: {
                lateMinutes,
                earlyLeaveMinutes,
                isWithinGrace,
            },
        };
    } else if (isLate) {
        return {
            status: 'late',
            present: true,
            details: {
                lateMinutes,
                isWithinGrace,
            },
        };
    } else if (isEarlyLeave) {
        return {
            status: 'early_leave',
            present: true,
            details: {
                earlyLeaveMinutes,
                isWithinGrace,
            },
        };
    } else {
        return {
            status: 'present',
            present: true,
            details: {
                isWithinGrace,
            },
        };
    }
}

/**
 * Get schedule rule for a specific day of week
 * 
 * @param dayOfWeek - Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @param rules - Array of schedule rules
 * @returns Matching rule or undefined if not found
 */
export function getScheduleRuleForDay(
    dayOfWeek: number,
    rules: ScheduleRule[]
): ScheduleRule | undefined {
    return rules.find((rule) => rule.day_of_week === dayOfWeek);
}

/**
 * Get day of week from a date using JavaScript convention
 * 
 * @param date - Date object or ISO date string
 * @returns Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 */
export function getDayOfWeek(date: Date | string): number {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.getDay();
}
