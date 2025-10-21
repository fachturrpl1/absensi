import { ChartConfig } from "@/components/ui/chart"

// Attendance Trends - 30 days
export const attendanceTrendsData = [
  { date: "Oct 1", present: 142, absent: 8, late: 15 },
  { date: "Oct 2", present: 148, absent: 5, late: 12 },
  { date: "Oct 3", present: 145, absent: 10, late: 10 },
  { date: "Oct 4", present: 151, absent: 4, late: 10 },
  { date: "Oct 5", present: 155, absent: 3, late: 7 },
  { date: "Oct 6", present: 138, absent: 12, late: 15 },
  { date: "Oct 7", present: 140, absent: 10, late: 15 },
  { date: "Oct 8", present: 152, absent: 4, late: 9 },
  { date: "Oct 9", present: 149, absent: 8, late: 8 },
  { date: "Oct 10", present: 156, absent: 2, late: 7 },
]

export const attendanceTrendsConfig = {
  present: {
    label: "Present",
    color: "hsl(0, 0%, 20%)",
  },
  absent: {
    label: "Absent",
    color: "hsl(0, 0%, 70%)",
  },
  late: {
    label: "Late",
    color: "hsl(0, 0%, 45%)",
  },
} as ChartConfig

// Department Performance
export const departmentPerformanceData = [
  { name: "Engineering", attendance: 94, target: 95, members: 42 },
  { name: "Sales", attendance: 88, target: 90, members: 28 },
  { name: "HR", attendance: 96, target: 95, members: 12 },
  { name: "Finance", attendance: 91, target: 92, members: 18 },
  { name: "Marketing", attendance: 85, target: 88, members: 15 },
]

export const departmentConfig = {
  attendance: {
    label: "Attendance %",
    color: "hsl(0, 0%, 25%)",
  },
  target: {
    label: "Target %",
    color: "hsl(0, 0%, 85%)",
  },
} as ChartConfig

// Status Distribution
export const statusDistributionData = [
  { status: "Present", value: 145, percentage: 79 },
  { status: "Absent", value: 18, percentage: 10 },
  { status: "Late", value: 15, percentage: 8 },
  { status: "Excused", value: 5, percentage: 3 },
]

export const statusConfig = {
  value: {
    label: "Count",
  },
  present: {
    label: "Present",
    color: "hsl(0, 0%, 15%)",
  },
  absent: {
    label: "Absent",
    color: "hsl(0, 0%, 75%)",
  },
  late: {
    label: "Late",
    color: "hsl(0, 0%, 50%)",
  },
  excused: {
    label: "Excused",
    color: "hsl(0, 0%, 60%)",
  },
} as ChartConfig

// Hourly Check-in Distribution
export const hourlyCheckInData = [
  { hour: "08:00", count: 45 },
  { hour: "08:30", count: 38 },
  { hour: "09:00", count: 32 },
  { hour: "09:30", count: 15 },
  { hour: "10:00", count: 8 },
  { hour: "10:30", count: 4 },
  { hour: "Late", count: 15 },
]

export const hourlyConfig = {
  count: {
    label: "Members",
    color: "hsl(0, 0%, 30%)",
  },
} as ChartConfig

// Weekly Stats
export const weeklyStatsData = [
  { week: "Week 1", rate: 82 },
  { week: "Week 2", rate: 85 },
  { week: "Week 3", rate: 88 },
  { week: "Week 4", rate: 90 },
  { week: "Week 5", rate: 87 },
]

export const weeklyStatsConfig = {
  rate: {
    label: "Attendance %",
    color: "hsl(0, 0%, 25%)",
  },
} as ChartConfig

// Recent Activity
export const recentActivityData = [
  {
    id: 1,
    name: "John Doe",
    dept: "Engineering",
    status: "Present",
    time: "08:15 AM",
    timestamp: "5m ago",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    dept: "Sales",
    status: "Late",
    time: "09:45 AM",
    timestamp: "12m ago",
  },
  {
    id: 3,
    name: "Mike Wilson",
    dept: "HR",
    status: "Present",
    time: "08:02 AM",
    timestamp: "28m ago",
  },
  {
    id: 4,
    name: "Emma Davis",
    dept: "Finance",
    status: "Absent",
    time: "-",
    timestamp: "1h ago",
  },
  {
    id: 5,
    name: "Alex Brown",
    dept: "Marketing",
    status: "Excused",
    time: "-",
    timestamp: "2h ago",
  },
]

// Department Stats
export const departmentStatsData = [
  { dept: "Engineering", onTime: 94, target: 95 },
  { dept: "Sales", onTime: 88, target: 90 },
  { dept: "HR", onTime: 96, target: 95 },
  { dept: "Finance", onTime: 91, target: 92 },
  { dept: "Marketing", onTime: 85, target: 88 },
]
