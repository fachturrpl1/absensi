"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Plus, Smartphone, CheckCircle2, XCircle, Search, RotateCcw, Grid3x3, Edit2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,

} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"

import { toast } from "sonner"

import { IAttendanceDevice, IDeviceType } from "@/interface"
import { getDeviceTypes } from "@/action/attendance_device"
import { TableSkeleton } from "@/components/ui/loading-skeleton"
import {
    Empty,
    EmptyHeader,
    EmptyTitle,
    EmptyDescription,
    EmptyMedia,
} from "@/components/ui/empty"
import { createClient } from "@/utils/supabase/client"
import { ActivateDeviceDialog } from "@/components/dialogs/activate-device-dialog"
import { PaginationFooter } from "@/components/tables/pagination-footer"
import { useOrgStore } from "@/store/org-store"
import { useDebounce } from "@/utils/debounce"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const editDeviceSchema = z.object({
    deviceName: z.string().min(1, "Device name is required"),
    location: z.string().optional(),
})
//tes
type EditDeviceForm = z.infer<typeof editDeviceSchema>

export default function AttendanceDevicesPage() {
    const [devices, setDevices] = React.useState<IAttendanceDevice[]>([])
    const [deviceTypes, setDeviceTypes] = React.useState<IDeviceType[]>([])
    const [loading, setLoading] = React.useState<boolean>(true)
    const [searchQuery, setSearchQuery] = React.useState<string>("")
    const [filterStatus, setFilterStatus] = React.useState<string>("active")
    const [filterDeviceType, setFilterDeviceType] = React.useState<string>("")
    const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list')
    const [currentPageIndex, setCurrentPageIndex] = React.useState<number>(0)
    const [currentPageSize, setCurrentPageSize] = React.useState<number>(8)
    const [editDialogOpen, setEditDialogOpen] = React.useState(false)
    const [selectedDevice, setSelectedDevice] = React.useState<IAttendanceDevice | null>(null)
    const [activateDialogOpen, setActivateDialogOpen] = React.useState(false)
    const orgId = useOrgStore((s) => s.organizationId)
    const deviceTypesLoadedRef = React.useRef(false)
    const lastFetchedOrgIdRef = React.useRef<number | null>(null)
    const devicesAbortRef = React.useRef<AbortController | null>(null)
    const [total, setTotal] = React.useState<number>(0)
    const [totalPages, setTotalPages] = React.useState<number>(1)
    const [from, setFrom] = React.useState<number>(0)
    const [to, setTo] = React.useState<number>(0)
    const debouncedSearch = useDebounce(searchQuery, 400)

    const editForm = useForm<EditDeviceForm>({
        resolver: zodResolver(editDeviceSchema),
        defaultValues: {
            deviceName: "",
            location: "",
        },
    })
    // removed top-level supabase client to avoid accidental extra calls; use local client only when needed

    const fetchDevices = React.useCallback(async () => {
        if (!orgId) {
            console.log('⚠️ Organization ID not set, skipping fetch')
            return
        }
        try {
            // cancel in-flight
            if (devicesAbortRef.current) {
                devicesAbortRef.current.abort()
            }
            const controller = new AbortController()
            devicesAbortRef.current = controller

            setLoading(true)
            const page = currentPageIndex + 1
            const limit = currentPageSize
            const params = new URLSearchParams({
                page: String(page),
                limit: String(limit),
            })
            // pass orgId to server to validate membership and scope query
            if (orgId) params.set('orgId', String(orgId))
            if (filterStatus) params.set('status', filterStatus)
            if (filterDeviceType) params.set('type', filterDeviceType)
            if (debouncedSearch) params.set('search', debouncedSearch)

            const res = await fetch(`/api/devices?${params.toString()}`, { signal: controller.signal })
            if (!res.ok) {
                let payload: unknown = null
                try { payload = await res.json() } catch { }
                const msg = (payload as { message?: string } | null)?.message || res.statusText
                // Graceful handling for auth/org errors
                if (res.status === 401) {
                    setDevices([]); setTotal(0); setTotalPages(1); setFrom(0); setTo(0)
                    toast.error('Unauthorized. Please login again.')
                    return
                }
                if (res.status === 403) {
                    setDevices([]); setTotal(0); setTotalPages(1); setFrom(0); setTo(0)
                    toast.message('No organization found. Join or create an organization first.')
                    return
                }
                throw new Error(msg || `Request failed: ${res.status}`)
            }
            const data = await res.json()
            if (!data?.success) {
                throw new Error(data?.message || 'Failed to fetch devices')
            }

            const items = (data.items ?? []) as IAttendanceDevice[]
            setDevices(items)
            setTotal(Number(data.total || 0))
            setTotalPages(Number(data.totalPages || 1))
            setFrom(Number(data.from || 0))
            setTo(Number(data.to || 0))

            // adjust page if out of range (e.g., after filters change)
            const newTotalPages = Number(data.totalPages || 1)
            if (page > newTotalPages && newTotalPages > 0) {
                setCurrentPageIndex(newTotalPages - 1)
            }
        } catch (error: unknown) {
            if ((error as any)?.name === 'AbortError') {
                console.log('🔪 Fetch aborted')
                return
            }
            console.error('❌ Error fetching devices:', error)
            toast.error(error instanceof Error ? error.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }, [orgId, currentPageIndex, currentPageSize, filterStatus, filterDeviceType, debouncedSearch])

    const fetchDeviceTypes = React.useCallback(async () => {
        try {
            const response = await getDeviceTypes()
            if (!response.success) throw new Error("Failed to fetch device types")
            setDeviceTypes(response.data)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'An error occurred')
        }
    }, [])

    React.useEffect(() => {
        if (deviceTypesLoadedRef.current) return
        deviceTypesLoadedRef.current = true
        fetchDeviceTypes()
    }, [fetchDeviceTypes])

    React.useEffect(() => {
        console.log('📍 Params changed:', { orgId, currentPageIndex, currentPageSize, filterStatus, filterDeviceType, debouncedSearch })
        if (!orgId) return
        // avoid duplicate fetch for same orgId on first mount
        if (lastFetchedOrgIdRef.current !== orgId) {
            lastFetchedOrgIdRef.current = orgId
        }
        fetchDevices()
    }, [orgId, currentPageIndex, currentPageSize, filterStatus, filterDeviceType, debouncedSearch, fetchDevices])

    const handleEditDevice = async (data: EditDeviceForm) => {
        if (!selectedDevice) return
        try {
            setLoading(true)
            const supabase = createClient()
            const { error } = await supabase
                .from('attendance_devices')
                .update({
                    device_name: data.deviceName,
                    location: data.location,
                })
                .eq('id', selectedDevice.id)

            if (error) throw error
            toast.success('Device updated successfully')
            setEditDialogOpen(false)
            fetchDevices()
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Failed to update device')
        } finally {
            setLoading(false)
        }
    }

    console.log('📊 Server items count:', devices.length, 'total:', total)

    return (
        <div className="flex flex-1 flex-col gap-4 w-full">
            <div className="w-full">
                <div className="w-full bg-card rounded-lg shadow-sm border">

                    <div className="p-4 md:p-6 space-y-4 overflow-x-auto">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <div className="relative flex-1 min-w-[260px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search devices..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPageIndex(0) }}
                                    className="pl-9"
                                />
                            </div>

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => fetchDevices()}
                                title="Refresh table"
                                className="ml-auto shrink-0"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'grid' ? 'default' : 'outline'}
                                size="icon"
                                onClick={() => {
                                    const newMode = viewMode === 'list' ? 'grid' : 'list'
                                    setViewMode(newMode)
                                }}
                                title={viewMode === 'list' ? 'Switch to grid view' : 'Switch to list view'}
                                className="shrink-0"
                            >
                                <Grid3x3 className="w-4 h-4" />
                            </Button>

                            <div className="shrink-0 w-24">
                                <select
                                    value={filterDeviceType}
                                    onChange={(e) => { setFilterDeviceType(e.target.value); setCurrentPageIndex(0) }}
                                    className="w-full px-2 py-2 border rounded-md text-sm bg-card"
                                >
                                    <option value="">All Types</option>
                                    {deviceTypes.map((dt) => (
                                        <option key={dt.id} value={dt.id}>
                                            {dt.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="shrink-0 w-24">
                                <select
                                    value={filterStatus || "active"}
                                    onChange={(e) => { setFilterStatus(e.target.value); setCurrentPageIndex(0) }}
                                    className="w-full px-2 py-2 border rounded-md text-sm bg-card"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <Button onClick={() => setActivateDialogOpen(true)} className="shrink-0">
                                Activate  <Plus className="ml-2" />
                            </Button>
                        </div>

                        <div className="mt-6">
                            {loading ? (
                                <TableSkeleton rows={6} columns={4} />
                            ) : total === 0 ? (
                                <div className="mt-20">
                                    <Empty>
                                        <EmptyHeader>
                                            <EmptyMedia variant="icon">
                                                <Smartphone className="h-14 w-14 text-muted-foreground mx-auto" />
                                            </EmptyMedia>
                                            <EmptyTitle>No devices activated</EmptyTitle>
                                            <EmptyDescription>
                                                You haven&apos;t activated any attendance devices yet. Click &quot;Activate &quot; to get started.
                                            </EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                </div>
                            ) : devices.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-muted-foreground">No devices match your filters</p>
                                </div>
                            ) : viewMode === 'grid' ? (
                                <div className="space-y-4 min-w-full">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 min-w-full">
                                        {devices.map((device: IAttendanceDevice) => (
                                            <div key={device.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow bg-card">
                                                <div className="space-y-2">
                                                    <div>
                                                        <h3 className="font-semibold text-base truncate">{device.device_name}</h3>
                                                        <p className="text-xs text-muted-foreground truncate">{device.serial_number || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Device Type</p>
                                                        <p className="text-xs font-medium truncate">{device.device_types?.name || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Location</p>
                                                        <p className="text-xs font-medium truncate">{device.location || '-'}</p>
                                                    </div>
                                                    <div className="flex items-center justify-between pt-1">
                                                        <span className="text-xs text-muted-foreground">Status</span>
                                                        {device.is_active ? (
                                                            <Badge className="bg-green-500 text-primary-foreground text-xs py-0.5"><CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Active</Badge>
                                                        ) : (
                                                            <Badge variant="destructive" className="text-xs py-0.5"><XCircle className="w-2.5 h-2.5 mr-0.5" /> Inactive</Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground pt-1 border-t">
                                                        <p>Created: {new Date(device.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <PaginationFooter
                                        page={currentPageIndex + 1}
                                        totalPages={totalPages}
                                        onPageChange={(p) => setCurrentPageIndex(Math.max(0, Math.min(p - 1, Math.max(0, totalPages - 1))))}
                                        isLoading={loading}
                                        from={from}
                                        to={to}
                                        total={total}
                                        pageSize={currentPageSize}
                                        onPageSizeChange={(size) => { setCurrentPageSize(size); setCurrentPageIndex(0); }}
                                        pageSizeOptions={[4, 8, 10, 24]}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-4 min-w-full">
                                    <div className="border rounded-lg overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Device Name</TableHead>
                                                    <TableHead>Serial Number</TableHead>
                                                    <TableHead>Device Type</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Location</TableHead>
                                                    <TableHead>Created At</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {devices.map((device: IAttendanceDevice) => (
                                                    <TableRow key={device.id}>
                                                        <TableCell>{device.device_name}</TableCell>
                                                        <TableCell>{device.serial_number || '-'}</TableCell>
                                                        <TableCell>{device.device_types?.name || '-'}</TableCell>
                                                        <TableCell>
                                                            {device.is_active ? (
                                                                <Badge className="bg-green-500 text-primary-foreground"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge>
                                                            ) : (
                                                                <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Inactive</Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{device.location || '-'}</TableCell>
                                                        <TableCell className="whitespace-nowrap">{new Date(device.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedDevice(device)
                                                                    editForm.reset({
                                                                        deviceName: device.device_name,
                                                                        location: device.location || "",
                                                                    })
                                                                    setEditDialogOpen(true)
                                                                }}
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    <PaginationFooter
                                        page={currentPageIndex + 1}
                                        totalPages={totalPages}
                                        onPageChange={(p) => setCurrentPageIndex(Math.max(0, Math.min(p - 1, Math.max(0, totalPages - 1))))}
                                        isLoading={loading}
                                        from={from}
                                        to={to}
                                        total={total}
                                        pageSize={currentPageSize}
                                        onPageSizeChange={(size) => { setCurrentPageSize(size); setCurrentPageIndex(0); }}
                                        pageSizeOptions={[4, 8, 10, 24]}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-semibold tracking-tight border-b pb-4  ">Edit Device</DialogTitle>
                    </DialogHeader>
                    {selectedDevice && (
                        <Form {...editForm}>
                            <form onSubmit={editForm.handleSubmit(handleEditDevice)} className="space-y-4">
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            value={selectedDevice.device_types?.name || '-'}
                                            disabled
                                            className="bg-muted cursor-not-allowed"
                                        />
                                    </FormControl>
                                </FormItem>
                                <FormItem>
                                    <FormLabel>Serial Number</FormLabel>
                                    <FormControl>
                                        <Input
                                            value={selectedDevice.serial_number || '-'}
                                            disabled
                                            className="bg-muted cursor-not-allowed"
                                        />
                                    </FormControl>
                                </FormItem>
                                <FormField
                                    control={editForm.control}
                                    name="deviceName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Device Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter device name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={editForm.control}
                                    name="location"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Location</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter location" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? "Saving..." : "Save"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    )}
                </DialogContent>
            </Dialog>

            <ActivateDeviceDialog
                open={activateDialogOpen}
                onOpenChange={setActivateDialogOpen}
                onSuccess={fetchDevices}
            />
        </div>
    )
}
