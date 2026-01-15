"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { ArrowRight, ChevronDown, Users, UserCheck, Clock, FileText, Calendar, Activity, BarChart3, Briefcase } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useDashboardStore } from "@/store/dashboard-store";
import { ManageWidgets } from "@/components/dashboard/manage-widgets";
import { useEffect, useState } from "react";

const DashboardMap = dynamic(() => import("@/components/dashboard/map-section"), {
    ssr: false,
    loading: () => <div className="w-full h-[500px] bg-muted/10 rounded-lg animate-pulse flex items-center justify-center text-muted-foreground">Loading Map...</div>,
})

// Dummy Data for Activity Table
const activityData = Array(5).fill({
    name: "Diah",
    division: "Design",
    position: "Owner",
    activity: "Absen Masuk (08 : 05 : 21)",
})

// Dummy Data for Staff Status Chart
const staffStatusData = [
    { name: "Staff Tetap", value: 10, color: "#00C49F" },    // Green
    { name: "Staff Kontrak", value: 3, color: "#FFBB28" },   // Orange/Yellow
    { name: "Staff Magang", value: 2, color: "#A78BFA" },    // Purple
]

// Dummy Data for Pending Requests
const pendingRequests = [
    { name: "Budi Santoso", type: "Cuti Tahunan", date: "15 Jan 2026", status: "Pending" },
    { name: "Siti Aminah", type: "Izin Sakit", date: "14 Jan 2026", status: "Pending" },
    { name: "Rudi Hermawan", type: "Lembur", date: "14 Jan 2026", status: "Pending" },
]

// Small Widgets (dummy)


// Large Widgets (dummy)
type LateMissedItem = { name: string; shift: string; issue: string; lateBy?: string; missed?: boolean }
const lateMissedShifts: LateMissedItem[] = [
    { name: "Anisa Putri", shift: "15 Jan, 08:00–17:00", issue: "Late", lateBy: "15m" },
    { name: "Bagus Wibowo", shift: "15 Jan, 08:00–17:00", issue: "Missed", missed: true },
    { name: "Citra Lestari", shift: "15 Jan, 08:00–17:00", issue: "Late", lateBy: "7m" },
]

type ManualTimeItem = { name: string; date: string; change: string; note: string }
const manualTime: ManualTimeItem[] = [
    { name: "Dimas Pratama", date: "15 Jan", change: "+0:30", note: "Add meeting" },
    { name: "Eka Sari", date: "15 Jan", change: "-0:10", note: "Trim break" },
]

type PaymentItem = { date: string; method: string; amount: string; status: "Paid" | "Processing" }
const payments: PaymentItem[] = [
    { date: "15 Jan", method: "Bank Transfer", amount: "Rp 12.500.000", status: "Paid" },
    { date: "14 Jan", method: "Bank Transfer", amount: "Rp 8.200.000", status: "Processing" },
]

type TimeOffBalance = { policy: string; balance: string; used: string }
const timeOffBalances: TimeOffBalance[] = [
    { policy: "Cuti Tahunan", balance: "8d", used: "4d" },
    { policy: "Sakit", balance: "Unlimited", used: "2d" },
]

type TimeOffRequest = { name: string; policy: string; range: string; status: "Pending" | "Approved" | "Rejected" }
const timeOffRequested: TimeOffRequest[] = [
    { name: "Farhan Akbar", policy: "Cuti Tahunan", range: "20–22 Jan", status: "Pending" },
    { name: "Gita Puspa", policy: "Sakit", range: "15 Jan", status: "Pending" },
]

type TimesheetRow = { name: string; start: string; stop: string; total: string }
const timesheetRows: TimesheetRow[] = [
    { name: "Hasan Basri", start: "08:05", stop: "17:15", total: "8h 40m" },
    { name: "Ika Nirmala", start: "08:20", stop: "17:00", total: "8h 10m" },
]

type TodoItem = { title: string; assignee: string; due: string; status: "Open" | "Done" }
const todos: TodoItem[] = [
    { title: "Lengkapi profil karyawan baru", assignee: "HR", due: "16 Jan", status: "Open" },
    { title: "Review kebijakan lembur", assignee: "Admin", due: "18 Jan", status: "Open" },
]

type ProjectActivity = { project: string; hours: string; tasks: number }
const currentProjectActivity: ProjectActivity[] = [
    { project: "Website Revamp", hours: "12h", tasks: 6 },
    { project: "Mobile App", hours: "7h", tasks: 3 },
]



export default function DashboardPage() {
    // Get today's date in Indonesian format
    const today = new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    })

    const totalStaff = 10000
    const { visibleWidgets } = useDashboardStore();
    const [hydrated, setHydrated] = useState(false);

    // Prevent hydration mismatch for persisted store
    useEffect(() => {
        setHydrated(true);
    }, []);

    if (!hydrated) {
        return <div className="p-6">Loading dashboard preferences...</div>
    }

    return (
        <div className="p-4 md:p-6 space-y-6 w-full bg-muted/10 min-h-screen">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <ManageWidgets />
            </div>

            {/* Top Summary Cards */}
            {/* Top Summary Cards (Stats) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {visibleWidgets.summary_total_staff && (
                    <Card className="shadow-sm">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Total Pegawai</p>
                                <h3 className="text-2xl font-bold">156</h3>
                            </div>
                            <div className="p-3 rounded-full text-blue-600 bg-blue-100">
                                <Users className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                )}
                {visibleWidgets.summary_present && (
                    <Card className="shadow-sm">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Hadir</p>
                                <h3 className="text-2xl font-bold">142</h3>
                            </div>
                            <div className="p-3 rounded-full text-green-600 bg-green-100">
                                <UserCheck className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                )}
                {visibleWidgets.summary_late && (
                    <Card className="shadow-sm">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Terlambat</p>
                                <h3 className="text-2xl font-bold">8</h3>
                            </div>
                            <div className="p-3 rounded-full text-orange-600 bg-orange-100">
                                <Clock className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                )}
                {visibleWidgets.summary_permission && (
                    <Card className="shadow-sm">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Izin / Sakit</p>
                                <h3 className="text-2xl font-bold">4</h3>
                            </div>
                            <div className="p-3 rounded-full text-purple-600 bg-purple-100">
                                <FileText className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {visibleWidgets.earned_week && <Card className="shadow-sm"><CardContent className="p-6 flex justify-between"><div><p className="text-sm text-muted-foreground">Earned this week</p><h3 className="text-2xl font-bold">Rp 3.450.000</h3></div><div className="p-3 rounded-full bg-blue-100 text-blue-600"><BarChart3 className="w-6 h-6" /></div></CardContent></Card>}
                {visibleWidgets.earned_today && <Card className="shadow-sm"><CardContent className="p-6 flex justify-between"><div><p className="text-sm text-muted-foreground">Earned today</p><h3 className="text-2xl font-bold">Rp 550.000</h3></div><div className="p-3 rounded-full bg-blue-100 text-blue-600"><BarChart3 className="w-6 h-6" /></div></CardContent></Card>}
                {visibleWidgets.worked_week && <Card className="shadow-sm"><CardContent className="p-6 flex justify-between"><div><p className="text-sm text-muted-foreground">Worked this week</p><h3 className="text-2xl font-bold">38h 25m</h3></div><div className="p-3 rounded-full bg-emerald-100 text-emerald-600"><Clock className="w-6 h-6" /></div></CardContent></Card>}
                {visibleWidgets.worked_today && <Card className="shadow-sm"><CardContent className="p-6 flex justify-between"><div><p className="text-sm text-muted-foreground">Worked today</p><h3 className="text-2xl font-bold">6h 40m</h3></div><div className="p-3 rounded-full bg-emerald-100 text-emerald-600"><Clock className="w-6 h-6" /></div></CardContent></Card>}
                {visibleWidgets.projects_worked && <Card className="shadow-sm"><CardContent className="p-6 flex justify-between"><div><p className="text-sm text-muted-foreground">Projects worked</p><h3 className="text-2xl font-bold">5</h3></div><div className="p-3 rounded-full bg-purple-100 text-purple-600"><Briefcase className="w-6 h-6" /></div></CardContent></Card>}
                {visibleWidgets.activity_today && <Card className="shadow-sm"><CardContent className="p-6 flex justify-between"><div><p className="text-sm text-muted-foreground">Today's activity</p><h3 className="text-2xl font-bold">Normal</h3></div><div className="p-3 rounded-full bg-cyan-100 text-cyan-600"><Activity className="w-6 h-6" /></div></CardContent></Card>}
                {visibleWidgets.activity_week && <Card className="shadow-sm"><CardContent className="p-6 flex justify-between"><div><p className="text-sm text-muted-foreground">Weekly activity</p><h3 className="text-2xl font-bold">↑ 12%</h3></div><div className="p-3 rounded-full bg-cyan-100 text-cyan-600"><Activity className="w-6 h-6" /></div></CardContent></Card>}
            </div>

            {/* Map Section */}
            {visibleWidgets.map && (
                <div className="w-full">
                    <DashboardMap />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel: Today's Activity */}
                {visibleWidgets.todays_activity_table && (
                    <Card className="lg:col-span-2 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <div className="space-y-1">
                                <h2 className="text-lg font-semibold">Aktivitas Hari Ini</h2>
                                <p className="text-muted-foreground text-base capitalize">{today}</p>
                            </div>
                            <Link href="/attendance/list">
                                <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 gap-2">
                                    Lihat Riwayat Absensi
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {/* Pagination Control */}
                            <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                                <span>Menampilkan</span>
                                <div className="relative">
                                    <select
                                        className="appearance-none border rounded px-3 py-1 bg-background pr-8 focus:outline-none focus:ring-1 focus:ring-ring"
                                        defaultValue={10}
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
                                </div>
                                <span>Baris per halaman</span>
                            </div>

                            {/* Table */}
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="font-semibold text-foreground">Nama Staff</TableHead>
                                            <TableHead className="font-semibold text-foreground">Divisi</TableHead>
                                            <TableHead className="font-semibold text-foreground">Jabatan</TableHead>
                                            <TableHead className="font-semibold text-foreground">Aktivitas</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activityData.map((row, index) => (
                                            <TableRow key={index} className="hover:bg-muted/50">
                                                <TableCell>{row.name}</TableCell>
                                                <TableCell>{row.division}</TableCell>
                                                <TableCell>{row.position}</TableCell>
                                                <TableCell>{row.activity}</TableCell>
                                            </TableRow>
                                        ))}
                                        {/* Empty state padding if needed */}
                                        {activityData.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center">
                                                    No activity found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Right Panel Wrapper: Chart + Requests */}
                <div className="space-y-6">
                    {/* Staff Status Chart */}
                    {visibleWidgets.staff_status_chart && (
                        <Card className="shadow-sm h-fit">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold">Data Status Staff</CardTitle>
                                    <Badge variant="secondary" className="bg-blue-500 text-white hover:bg-blue-600">
                                        Jml Staff : {totalStaff}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center">
                                {/* Donut Chart */}
                                <div className="h-[250px] w-full mt-4 relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={staffStatusData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={0}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {staffStatusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: number) => [value, 'Staff']}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>

                                    {/* Center Text */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                                        <div className="text-2xl font-bold">66.67%</div>
                                    </div>
                                </div>

                                {/* Custom Legend */}
                                <div className="w-full space-y-3 mt-4 self-start pl-4">
                                    <h4 className="font-semibold text-sm mb-2">Keterangan:</h4>
                                    {staffStatusData.map((item) => (
                                        <div key={item.name} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="w-3 h-3 rounded-sm"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <span className="text-muted-foreground">{item.name}</span>
                                            </div>
                                            <span className="font-medium">:{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Permission Requests List */}
                    {visibleWidgets.permission_requests && (
                        <Card className="shadow-sm">
                            <CardHeader className="pb-3 border-b mb-2">
                                <CardTitle className="text-base font-semibold flex items-center justify-between">
                                    Daftar Pengajuan
                                    <Badge variant="outline" className="text-xs font-normal">3 Pending</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {pendingRequests.map((req, idx) => (
                                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none">{req.name}</p>
                                                <p className="text-xs text-muted-foreground">{req.type}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full inline-block mb-1">
                                                    {req.status}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                                                    <Calendar className="w-3 h-3" />
                                                    {req.date}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 border-t text-center">
                                    <Button variant="ghost" size="sm" className="w-full text-xs text-blue-600 hover:text-blue-700 h-8">
                                        Lihat Semua Pengajuan
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
            {/* Widgets Section */}
            <div className="mt-8 space-y-6">
                {/* Large widgets */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Late & Missed Shifts */}
                    {visibleWidgets.late_missed_shifts && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Late & Missed Shifts</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {lateMissedShifts.map((it, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <div>
                                                <div className="font-medium">{it.name}</div>
                                                <div className="text-muted-foreground">{it.shift}</div>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant={it.missed ? "destructive" : "secondary"} className={it.missed ? "" : "bg-orange-100 text-orange-700"}>
                                                    {it.missed ? "Missed" : `Late ${it.lateBy ?? ""}`}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Manual Time */}
                    {visibleWidgets.manual_time && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Manual Time</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {manualTime.map((it, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <div>
                                                <div className="font-medium">{it.name}</div>
                                                <div className="text-muted-foreground">{it.date} • {it.note}</div>
                                            </div>
                                            <div className="font-medium">{it.change}</div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Payments */}
                    {visibleWidgets.payments && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Payments</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {payments.map((p, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <div>
                                                <div className="font-medium">{p.date}</div>
                                                <div className="text-muted-foreground">{p.method}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold">{p.amount}</div>
                                                <div className="text-xs text-muted-foreground">{p.status}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Time off balances */}
                    {visibleWidgets.time_off_balances && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Time off balances</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Policy</TableHead>
                                            <TableHead>Balance</TableHead>
                                            <TableHead>Used</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {timeOffBalances.map((b, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>{b.policy}</TableCell>
                                                <TableCell>{b.balance}</TableCell>
                                                <TableCell>{b.used}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {/* Time off requested */}
                    {visibleWidgets.time_off_requested && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Time off requested</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {timeOffRequested.map((r, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <div>
                                                <div className="font-medium">{r.name}</div>
                                                <div className="text-muted-foreground">{r.policy} • {r.range}</div>
                                            </div>
                                            <Badge variant="outline" className="text-xs">{r.status}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Timesheet */}
                    {visibleWidgets.timesheet && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Timesheet</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Member</TableHead>
                                            <TableHead>Start</TableHead>
                                            <TableHead>Stop</TableHead>
                                            <TableHead>Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {timesheetRows.map((row, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>{row.name}</TableCell>
                                                <TableCell>{row.start}</TableCell>
                                                <TableCell>{row.stop}</TableCell>
                                                <TableCell>{row.total}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {/* To-dos */}
                    {visibleWidgets.todos && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">To-dos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {todos.map((t, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <div>
                                                <div className="font-medium">{t.title}</div>
                                                <div className="text-muted-foreground">{t.assignee} • Due {t.due}</div>
                                            </div>
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">{t.status}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Current project activity */}
                    {visibleWidgets.current_project_activity && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Current project activity</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {currentProjectActivity.map((p, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm">
                                            <div className="font-medium">{p.project}</div>
                                            <div className="text-right text-muted-foreground">{p.hours} • {p.tasks} tasks</div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
