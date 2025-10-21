import { ChartConfig } from "@/components/ui/chart"

// Attendance Distribution Chart Data
export const attendanceDistributionChartData = [
  { date: "1-5", present: 120, absent: 15, late: 20, excused: 10 },
  { date: "6-10", present: 135, absent: 12, late: 18, excused: 8 },
  { date: "11-15", present: 128, absent: 18, late: 22, excused: 12 },
  { date: "16-20", present: 140, absent: 10, late: 15, excused: 5 },
  { date: "21-25", present: 145, absent: 8, late: 12, excused: 8 },
  { date: "26-30", present: 138, absent: 14, late: 18, excused: 10 },
]

export const attendanceDistributionConfig = {
  present: {
    label: "Present",
    color: "var(--chart-1)",
  },
  absent: {
    label: "Absent",
    color: "var(--chart-2)",
  },
  late: {
    label: "Late",
    color: "var(--chart-3)",
  },
  excused: {
    label: "Excused",
    color: "var(--chart-4)",
  },
} as ChartConfig

// Attendance Trend
export const attendanceTrendData = [
  { month: "Jan 2025", attendance: 82 },
  { month: "Feb 2025", attendance: 85 },
  { month: "Mar 2025", attendance: 88 },
  { month: "Apr 2025", attendance: 86 },
  { month: "May 2025", attendance: 90 },
  { month: "Jun 2025", attendance: 89 },
  { month: "Jul 2025", attendance: 91 },
  { month: "Aug 2025", attendance: 92 },
  { month: "Sep 2025", attendance: 94 },
  { month: "Oct 2025", attendance: 93 },
  { month: "Nov 2025", attendance: 95 },
  { month: "Dec 2025", attendance: 96 },
]

export const attendanceTrendConfig = {
  attendance: {
    label: "Attendance Rate %",
    color: "var(--chart-1)",
  },
} as ChartConfig

// Department Performance Data
export const departmentPerformanceData = [
  { department: "Engineering", actual: 92, target: 95 },
  { department: "Sales", actual: 88, target: 90 },
  { department: "HR", actual: 96, target: 95 },
  { department: "Finance", actual: 90, target: 92 },
  { department: "Marketing", actual: 85, target: 88 },
  { department: "Operations", actual: 89, target: 90 },
].map((row) => ({
  ...row,
  remaining: Math.max(0, row.target - row.actual),
}))

export const departmentPerformanceConfig = {
  actual: {
    label: "Actual",
    color: "var(--chart-1)",
  },
  remaining: {
    label: "Target",
    color: "var(--chart-2)",
  },
} as ChartConfig

// Attendance by Status (Pie Chart)
export const attendanceByStatusData = [
  { status: "Present", members: 145, fill: "var(--color-present)" },
  { status: "Absent", members: 12, fill: "var(--color-absent)" },
  { status: "Late", members: 18, fill: "var(--color-late)" },
  { status: "Excused", members: 8, fill: "var(--color-excused)" },
]

export const attendanceByStatusConfig = {
  members: {
    label: "Members",
  },
  present: {
    label: "Present",
    color: "var(--chart-1)",
  },
  absent: {
    label: "Absent",
    color: "var(--chart-2)",
  },
  late: {
    label: "Late",
    color: "var(--chart-3)",
  },
  excused: {
    label: "Excused",
    color: "var(--chart-4)",
  },
} as ChartConfig

// Attendance Pipeline (Funnel)
export const attendancePipelineData = [
  { stage: "All Members", value: 183, fill: "var(--chart-1)" },
  { stage: "Checked In", value: 145, fill: "var(--chart-2)" },
  { stage: "On Time", value: 127, fill: "var(--chart-3)" },
  { stage: "Completed", value: 112, fill: "var(--chart-4)" },
]

export const attendancePipelineConfig = {
  value: {
    label: "Members",
    color: "var(--chart-1)",
  },
  stage: {
    label: "Stage",
  },
} as ChartConfig

// Attendance by Department
export const attendanceByDepartmentData = [
  {
    department: "Engineering",
    attendance: 92,
    percentage: 28,
    growth: "+5.2%",
    isPositive: true,
  },
  {
    department: "Sales",
    attendance: 88,
    percentage: 26,
    growth: "+2.8%",
    isPositive: true,
  },
  {
    department: "HR",
    attendance: 96,
    percentage: 22,
    growth: "+8.1%",
    isPositive: true,
  },
  {
    department: "Finance",
    attendance: 90,
    percentage: 14,
    growth: "-1.5%",
    isPositive: false,
  },
  {
    department: "Marketing",
    attendance: 85,
    percentage: 7,
    growth: "+3.2%",
    isPositive: true,
  },
  {
    department: "Operations",
    attendance: 89,
    percentage: 3,
    growth: "+1.8%",
    isPositive: true,
  },
]

// Action Items
export const attendanceActionItems = [
  {
    id: 1,
    title: "Follow up with absent members",
    desc: "Contact 12 members who were absent today",
    due: "Due today",
    priority: "High",
    checked: false,
  },
  {
    id: 2,
    title: "Review late arrivals",
    desc: "Check in with 18 members who arrived late",
    due: "Due tomorrow",
    priority: "Medium",
    checked: true,
  },
  {
    id: 3,
    title: "Generate weekly report",
    desc: "Create attendance summary for executives",
    due: "Due this week",
    priority: "Medium",
    checked: false,
  },
  {
    id: 4,
    title: "Update attendance policy",
    desc: "Review and finalize updated policy",
    due: "Due next week",
    priority: "Low",
    checked: false,
  },
]

// Recent Activity
export const recentAttendanceActivity = [
  {
    id: "A-1001",
    memberName: "John Doe",
    department: "Engineering",
    status: "Present",
    checkInTime: "08:30 AM",
    lastUpdate: "5m ago",
  },
  {
    id: "A-1002",
    memberName: "Jane Smith",
    department: "Sales",
    status: "Late",
    checkInTime: "09:15 AM",
    lastUpdate: "10m ago",
  },
  {
    id: "A-1003",
    memberName: "Bob Johnson",
    department: "HR",
    status: "Present",
    checkInTime: "08:00 AM",
    lastUpdate: "15m ago",
  },
  {
    id: "A-1004",
    memberName: "Alice Brown",
    department: "Finance",
    status: "Absent",
    checkInTime: "-",
    lastUpdate: "1h ago",
  },
  {
    id: "A-1005",
    memberName: "Charlie Wilson",
    department: "Marketing",
    status: "Excused",
    checkInTime: "-",
    lastUpdate: "2h ago",
  },
]
