import { Check, X, Clock, Info } from "lucide-react"

// Static data - tidak perlu fetch dari DB
export const ATTENDANCE_STATUSES = [
  { value: "present", label: "Present", color: "bg-green-500 text-white", icon: Check },
  { value: "absent", label: "Absent", color: "bg-gray-300 text-black", icon: X },
  { value: "late", label: "Late", color: "bg-red-500 text-white", icon: Clock },
  { value: "excused", label: "Excused", color: "bg-blue-500 text-white", icon: Info },
  { value: "early_leave", label: "Early Leave", color: "bg-purple-500 text-white", icon: Check },
] as const

export const TIME_FORMATS = [
  { value: "12h", label: "12 Hour (AM/PM)" },
  { value: "24h", label: "24 Hour" },
] as const

export const SCHEDULE_TYPES = [
  { value: "fixed", label: "Fixed Schedule" },
  { value: "shift", label: "Shift Schedule" },
  { value: "flexible", label: "Flexible Schedule" },
] as const

export const WEEKDAYS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
] as const

export const TIMEZONES = [
  { value: "Asia/Jakarta", label: "WIB - Jakarta" },
  { value: "Asia/Makassar", label: "WITA - Makassar" },
  { value: "Asia/Jayapura", label: "WIT - Jayapura" },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "EST - New York" },
  { value: "Europe/London", label: "GMT - London" },
] as const
