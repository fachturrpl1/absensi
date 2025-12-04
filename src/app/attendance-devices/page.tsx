"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Plus, Smartphone, CheckCircle2, XCircle, Search, RotateCcw, Grid3x3, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit2 } from "lucide-react"
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
import {
    getOrganizationDevices,
    getDeviceTypes,
} from "@/action/attendance_device"
import { TableSkeleton } from "@/components/ui/loading-skeleton"
import {
    Empty,
    EmptyHeader,
    EmptyTitle,
    EmptyDescription,
    EmptyContent,
    EmptyMedia,
} from "@/components/ui/empty"
import { createClient } from "@/utils/supabase/client"
import { ActivateDeviceDialog } from "@/components/dialogs/activate-device-dialog"

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
    const [organizationId, setOrganizationId] = React.useState<number | null>(null)
    const [searchQuery, setSearchQuery] = React.useState<string>("")
    const [filterStatus, setFilterStatus] = React.useState<string>("active")
    const [filterDeviceType, setFilterDeviceType] = React.useState<string>("")
    const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list')
    const [currentPageIndex, setCurrentPageIndex] = React.useState<number>(0)
    const [currentPageSize, setCurrentPageSize] = React.useState<number>(8)
    const [editDialogOpen, setEditDialogOpen] = React.useState(false)
    const [selectedDevice, setSelectedDevice] = React.useState<IAttendanceDevice | null>(null)
    const [activateDialogOpen, setActivateDialogOpen] = React.useState(false)

    const editForm = useForm<EditDeviceForm>({
        resolver: zodResolver(editDeviceSchema),
        defaultValues: {
            deviceName: "",
            location: "",
        },
    })

    const supabase = createClient()

    const fetchDevices = React.useCallback(async () => {
        if (!organizationId) {
            console.log('⚠️ Organization ID not set, skipping fetch')
            return
        }
        try {
            setLoading(true)
            console.log('🔄 Fetching devices for org:', organizationId)
            const response = await getOrganizationDevices(organizationId)
            console.log('📊 API Response:', response)
            if (!response.success) throw new Error("Failed to fetch devices")
            console.log('📊 Fetched devices:', response.data)
            console.log('📊 Total devices:', response.data.length)
            console.log('📊 Devices details:', JSON.stringify(response.data, null, 2))
            setDevices(response.data)
        } catch (error: unknown) {
            console.error('❌ Error fetching devices:', error)
            toast.error(error instanceof Error ? error.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }, [organizationId])

    const fetchDeviceTypes = React.useCallback(async () => {
        try {
            const response = await getDeviceTypes()
            if (!response.success) throw new Error("Failed to fetch device types")
            setDeviceTypes(response.data)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'An error occurred')
        }
    }, [])

    const fetchOrganizationId = React.useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            console.log('👤 Current user:', user?.id)
            if (!user) {
                console.log('❌ No user found')
                return
            }

            const { data, error } = await supabase
                .from("organization_members")
                .select("organization_id")
                .eq("user_id", user.id)

            console.log('🏢 Organization data:', data)
            console.log('🏢 Organization error:', error)
            
            if (error) throw error
            if (data && data.length > 0 && data[0]?.organization_id) {
                console.log('✅ Organization ID set:', data[0].organization_id)
                setOrganizationId(data[0].organization_id)
            } else {
                console.log('⚠️ No organization found for user')
            }
        } catch (error: unknown) {
            console.error('❌ Error fetching organization:', error)
            toast.error(error instanceof Error ? error.message : 'Unknown error')
        }
    }, [supabase])

    React.useEffect(() => {
        const initializeData = async () => {
            await fetchOrganizationId()
            await fetchDeviceTypes()
        }
        initializeData()
    }, [fetchOrganizationId, fetchDeviceTypes])

    React.useEffect(() => {
        console.log('📍 Organization ID changed:', organizationId)
        if (organizationId) {
            console.log('🔄 Fetching devices for organization:', organizationId)
            fetchDevices()
        } else {
            console.log('⚠️ No organization ID, not fetching devices')
        }
    }, [organizationId, fetchDevices])

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


    const deviceColumns: ColumnDef<IAttendanceDevice>[] = [
        { 
            accessorKey: "device_name", 
            header: "Device Name",
        },
        { 
            accessorKey: "serial_number", 
            header: "Serial Number",
        },
        { 
            accessorKey: "device_types.name", 
            header: "Device Type",
            cell: ({ row }) => row.original.device_types?.name || "-"
        },
        {
            accessorKey: "is_active",
            header: "Status",
            cell: ({ row }) => (
                row.original.is_active ? 
                    <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge> : 
                    <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Inactive</Badge>
            ),
        },
        {
            accessorKey: "location",
            header: "Location",
            cell: ({ row }) => row.original.location || "-"
        },
        {
            accessorKey: "created_at",
            header: "Created At",
            cell: ({ row }) => {
                const date = new Date(row.original.created_at)
                return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            }
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        setSelectedDevice(row.original)
                        editForm.reset({
                            deviceName: row.original.device_name,
                            location: row.original.location || "",
                        })
                        setEditDialogOpen(true)
                    }}
                >
                    <Edit2 className="w-4 h-4" />
                </Button>
            ),
        },
    ]

    const filteredDevices = devices.filter(device => {
        const matchesSearch = !searchQuery || 
                            device.device_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (device.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
        const matchesStatus = filterStatus === 'active' ? device.is_active : !device.is_active
        const matchesType = !filterDeviceType || String(device.device_types?.id) === filterDeviceType
        
        const passes = matchesSearch && matchesStatus && matchesType
        if (!passes) {
            console.log(`❌ Device filtered out: ${device.device_name}`, {
                matchesSearch,
                matchesStatus,
                matchesType,
                searchQuery,
                filterStatus,
                filterDeviceType,
                device_is_active: device.is_active
            })
        }
        return passes
    })
    console.log('📊 Filtered devices count:', filteredDevices.length, 'from total:', devices.length)

    return (
        <div className="flex flex-1 flex-col gap-4 w-full">
            <div className="w-full">
                <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="bg-white text-black px-4 md:px-6 py-4 rounded-t-lg border-b-2 border-black-200">
                        <h1 className='text-2xl md:text-3xl font-bold tracking-tight'>Devices</h1>
                    </div>
                    
                    <div className="p-4 md:p-6 space-y-4 overflow-x-auto">
                        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search devices..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    onClick={() => fetchDevices()}
                                    title="Refresh table"
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
                                >
                                    <Grid3x3 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-start sm:items-center sm:justify-between">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Device Type:</span>
                                    <select
                                        value={filterDeviceType}
                                        onChange={(e) => setFilterDeviceType(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white flex-1 sm:flex-none"
                                    >
                                        <option value="">All Types</option>
                                        {deviceTypes.map((dt) => (
                                            <option key={dt.id} value={dt.id}>
                                                {dt.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Status:</span>
                                    <select
                                        value={filterStatus || "active"}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white flex-1 sm:flex-none"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <Button onClick={() => setActivateDialogOpen(true)} className="w-full sm:w-auto">
                                Activate  <Plus className="ml-2" />
                            </Button>
                        </div>

                        <div className="mt-6">
                            {loading ? (
                                <TableSkeleton rows={6} columns={4} />
                            ) : devices.length === 0 ? (
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
                                        <EmptyContent>
                                            <Button onClick={() => setActivateDialogOpen(true)}>Activate </Button>
                                        </EmptyContent>
                                    </Empty>
                                </div>
                            ) : filteredDevices.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-gray-500">No devices match your filters</p>
                                </div>
                            ) : viewMode === 'grid' ? (
                                <div className="space-y-4 min-w-full">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 min-w-full">
                                        {filteredDevices.slice(currentPageIndex * currentPageSize, (currentPageIndex + 1) * currentPageSize).map((device) => (
                                            <div key={device.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow bg-white">
                                                <div className="space-y-2">
                                                    <div>
                                                        <h3 className="font-semibold text-base truncate">{device.device_name}</h3>
                                                        <p className="text-xs text-gray-500 truncate">{device.serial_number || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-600">Device Type</p>
                                                        <p className="text-xs font-medium truncate">{device.device_types?.name || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-600">Location</p>
                                                        <p className="text-xs font-medium truncate">{device.location || '-'}</p>
                                                    </div>
                                                    <div className="flex items-center justify-between pt-1">
                                                        <span className="text-xs text-gray-600">Status</span>
                                                        {device.is_active ? (
                                                            <Badge className="bg-green-500 text-xs py-0.5"><CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Active</Badge>
                                                        ) : (
                                                            <Badge variant="destructive" className="text-xs py-0.5"><XCircle className="w-2.5 h-2.5 mr-0.5" /> Inactive</Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500 pt-1 border-t">
                                                        <p>Created: {new Date(device.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between py-4 px-4 bg-gray-50 rounded-md border">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setCurrentPageIndex(0)}
                                                disabled={currentPageIndex === 0 || loading}
                                                className="h-8 w-8 p-0"
                                                title="First page"
                                            >
                                                <ChevronsLeft className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                                                disabled={currentPageIndex === 0 || loading}
                                                className="h-8 w-8 p-0"
                                                title="Previous page"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <span className="text-sm text-muted-foreground">Page</span>
                                            <input
                                                type="number"
                                                min="1"
                                                max={Math.ceil(filteredDevices.length / currentPageSize)}
                                                value={currentPageIndex + 1}
                                                onChange={(e) => {
                                                    const page = e.target.value ? Number(e.target.value) - 1 : 0
                                                    setCurrentPageIndex(Math.max(0, Math.min(page, Math.ceil(filteredDevices.length / currentPageSize) - 1)))
                                                }}
                                                className="w-12 h-8 px-2 border rounded text-sm text-center"
                                                disabled={loading}
                                            />
                                            <span className="text-sm text-muted-foreground">/ {Math.ceil(filteredDevices.length / currentPageSize)}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setCurrentPageIndex(Math.min(Math.ceil(filteredDevices.length / currentPageSize) - 1, currentPageIndex + 1))}
                                                disabled={currentPageIndex >= Math.ceil(filteredDevices.length / currentPageSize) - 1 || loading}
                                                className="h-8 w-8 p-0"
                                                title="Next page"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setCurrentPageIndex(Math.ceil(filteredDevices.length / currentPageSize) - 1)}
                                                disabled={currentPageIndex >= Math.ceil(filteredDevices.length / currentPageSize) - 1 || loading}
                                                className="h-8 w-8 p-0"
                                                title="Last page"
                                            >
                                                <ChevronsRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-sm text-muted-foreground">
                                                Showing {filteredDevices.length > 0 ? currentPageIndex * currentPageSize + 1 : 0} to {Math.min((currentPageIndex + 1) * currentPageSize, filteredDevices.length)} of {filteredDevices.length} total records
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={currentPageSize}
                                                    onChange={(e) => {
                                                        setCurrentPageSize(Number(e.target.value))
                                                        setCurrentPageIndex(0)
                                                    }}
                                                    className="px-2 py-1 border rounded text-sm bg-white"
                                                >
                                                    <option value="4">4</option>
                                                    <option value="8">8</option>
                                                    <option value="10">10</option>
                                                    <option value="24">24</option>
                                                    <option value={filteredDevices.length}>All</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>  
                            ) : (
                                <div className="min-w-full overflow-x-auto">
                                    <DataTable 
                                        columns={deviceColumns} 
                                        data={filteredDevices}
                                        showGlobalFilter={false}
                                        showFilters={false}
                                        showColumnToggle={false}
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
                        <DialogTitle className="font-semibold tracking-tight border-b border-gray-200 pb-4  ">Edit Device</DialogTitle>
                    </DialogHeader>
                    {selectedDevice && (
                        <Form {...editForm}>
                            <form onSubmit={editForm.handleSubmit(handleEditDevice)} className="space-y-4">
                                <FormItem>
                                    <FormLabel>Device Type</FormLabel>
                                    <FormControl>
                                        <Input 
                                            value={selectedDevice.device_types?.name || '-'} 
                                            disabled 
                                            className="bg-gray-100 cursor-not-allowed"
                                        />
                                    </FormControl>
                                </FormItem>
                                <FormItem>
                                    <FormLabel>Serial Number</FormLabel>
                                    <FormControl>
                                        <Input 
                                            value={selectedDevice.serial_number || '-'} 
                                            disabled 
                                            className="bg-gray-100 cursor-not-allowed"
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
