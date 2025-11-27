"use client"

import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Trash, Pencil, Plus, Smartphone, CheckCircle2, XCircle } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"

import { IAttendanceDevice, IDeviceType } from "@/interface"
import {
    getOrganizationDevices,
    activateDevice,
    deactivateDevice,
    getDeviceTypes,
    createDeviceType,
    updateDeviceType,
    deleteDeviceType,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/utils/supabase/client"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Device activation schema
const activationSchema = z.object({
    deviceCode: z.string().min(1, "Device code is required"),
    serialNumber: z.string().min(1, "Serial number is required"),
})

// Device type schema
const deviceTypeSchema = z.object({
    code: z.string().min(2, "Code must be at least 2 characters").regex(/^[A-Z0-9-]+$/, "Code must be uppercase letters, numbers, and hyphens only"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    category: z.string().min(1, "Category is required"),
    manufacturer: z.string().optional(),
    model: z.string().optional(),
})

type ActivationForm = z.infer<typeof activationSchema>
type DeviceTypeForm = z.infer<typeof deviceTypeSchema>

export default function AttendanceDevicesPage() {
    const [activationOpen, setActivationOpen] = React.useState(false)
    const [deviceTypeOpen, setDeviceTypeOpen] = React.useState(false)
    const [editingDeviceType, setEditingDeviceType] = React.useState<IDeviceType | null>(null)
    const [devices, setDevices] = React.useState<IAttendanceDevice[]>([])
    const [deviceTypes, setDeviceTypes] = React.useState<IDeviceType[]>([])
    const [loading, setLoading] = React.useState<boolean>(true)
    const [organizationId, setOrganizationId] = React.useState<number | null>(null)
    const [selectedDeviceCode, setSelectedDeviceCode] = React.useState<string>("")

    const supabase = createClient()

    const fetchDevices = async () => {
        if (!organizationId) return
        try {
            setLoading(true)
            const response = await getOrganizationDevices(organizationId)
            if (!response.success) throw new Error("Failed to fetch devices")
            setDevices(response.data)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const fetchDeviceTypes = async () => {
        try {
            const response = await getDeviceTypes()
            if (!response.success) throw new Error("Failed to fetch device types")
            setDeviceTypes(response.data)
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'An error occurred')
        }
    }

    const fetchOrganizationId = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from("organization_members")
                .select("organization_id")
                .eq("user_id", user.id)

            if (error) throw error
            if (data && data.length > 0 && data[0]?.organization_id) {
                setOrganizationId(data[0].organization_id)
            }
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Unknown error')
        }
    }

    React.useEffect(() => {
        fetchOrganizationId()
        fetchDeviceTypes()
    }, [])

    React.useEffect(() => {
        if (organizationId) {
            fetchDevices()
        }
    }, [organizationId])

    const activationForm = useForm<ActivationForm>({
        resolver: zodResolver(activationSchema),
        defaultValues: {
            deviceCode: "",
            serialNumber: "",
        },
    })

    const deviceTypeForm = useForm<DeviceTypeForm>({
        resolver: zodResolver(deviceTypeSchema),
        defaultValues: {
            code: "",
            name: "",
            category: "",
            manufacturer: "",
            model: "",
        },
    })

    // Watch device code selection
    React.useEffect(() => {
        const subscription = activationForm.watch((value, { name }) => {
            if (name === "deviceCode" && value.deviceCode) {
                setSelectedDeviceCode(value.deviceCode)
            }
        })
        return () => subscription.unsubscribe()
    }, [activationForm])

    const handleActivation = async (values: ActivationForm) => {
        if (!organizationId) {
            toast.error("Organization not found")
            return
        }

        try {
            // Construct full serial number: DEVICE_CODE-SERIAL
            const fullSerialNumber = `${values.deviceCode}-${values.serialNumber}`
            
            const res = await activateDevice(fullSerialNumber, organizationId)
            if (!res.success) throw new Error(res.message)
            
            toast.success(res.message || 'Device activated successfully')
            setActivationOpen(false)
            activationForm.reset()
            fetchDevices()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    const handleDeactivation = async (deviceId: string) => {
        try {
            setLoading(true)
            const response = await deactivateDevice(deviceId)
            if (!response.success) throw new Error(response.message)
            toast.success(response.message || 'Device deactivated successfully')
            fetchDevices()
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    const handleDeviceTypeSubmit = async (values: DeviceTypeForm) => {
        try {
            let res
            if (editingDeviceType) {
                res = await updateDeviceType(editingDeviceType.id, values)
            } else {
                res = await createDeviceType(values)
            }
            if (!res.success) throw new Error(res.message)
            toast.success(editingDeviceType ? 'Device type updated successfully' : 'Device type created successfully')
            setDeviceTypeOpen(false)
            setEditingDeviceType(null)
            deviceTypeForm.reset()
            fetchDeviceTypes()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    const handleDeleteDeviceType = async (deviceTypeId: string) => {
        try {
            setLoading(true)
            const response = await deleteDeviceType(deviceTypeId)
            if (!response.success) throw new Error(response.message)
            toast.success('Device type deleted successfully')
            fetchDeviceTypes()
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Unknown error')
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
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const device = row.original
                return (
                    <div className="flex gap-2">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500"
                                >
                                    Deactivate
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Deactivate Device</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to deactivate this device? It can be reactivated later.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => handleDeactivation(device.id)}
                                    >
                                        Deactivate
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )
            },
        },
    ]

    const deviceTypeColumns: ColumnDef<IDeviceType>[] = [
        { accessorKey: "code", header: "Code" },
        { accessorKey: "name", header: "Name" },
        { accessorKey: "category", header: "Category" },
        { accessorKey: "manufacturer", header: "Manufacturer" },
        { accessorKey: "model", header: "Model" },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const deviceType = row.original
                return (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="border-0 cursor-pointer"
                            onClick={() => {
                                setEditingDeviceType(deviceType)
                                deviceTypeForm.reset({
                                    code: deviceType.code || "",
                                    name: deviceType.name,
                                    category: deviceType.category,
                                    manufacturer: deviceType.manufacturer || "",
                                    model: deviceType.model || "",
                                })
                                setDeviceTypeOpen(true)
                            }}
                        >
                            <Pencil />
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="text-red-500 border-0 cursor-pointer"
                                >
                                    <Trash />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Device Type</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete this device type?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => handleDeleteDeviceType(deviceType.id)}
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )
            },
        },
    ]

    return (
        <div className="flex flex-1 flex-col gap-4">
            <div className="w-full max-w-6xl mx-auto">
                <Tabs defaultValue="devices" className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="devices">My Devices</TabsTrigger>
                        <TabsTrigger value="device-types">Device Types</TabsTrigger>
                    </TabsList>

                    <TabsContent value="devices">
                        <div className="items-center my-7">
                            <Dialog open={activationOpen} onOpenChange={setActivationOpen}>
                                <DialogTrigger asChild className="float-end ml-5">
                                    <Button>
                                        Activate Device <Plus className="ml-2" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Activate Attendance Device</DialogTitle>
                                        <DialogDescription>
                                            Select the device type and enter the serial number to activate your attendance device.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Form {...activationForm}>
                                        <form
                                            onSubmit={activationForm.handleSubmit(handleActivation)}
                                            className="space-y-4"
                                        >
                                            <FormField
                                                control={activationForm.control}
                                                name="deviceCode"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Device Type</FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select device type..." />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {deviceTypes.map((dt) => (
                                                                    <SelectItem key={dt.id} value={dt.code || ""}>
                                                                        {dt.name} ({dt.code})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={activationForm.control}
                                                name="serialNumber"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Serial Number</FormLabel>
                                                        <FormControl>
                                                            <div className="flex items-center gap-2">
                                                                {selectedDeviceCode && (
                                                                    <span className="text-sm text-muted-foreground">
                                                                        {selectedDeviceCode}-
                                                                    </span>
                                                                )}
                                                                <Input 
                                                                    type="text" 
                                                                    placeholder="Enter serial number"
                                                                    {...field} 
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                        {selectedDeviceCode && field.value && (
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Full serial: <strong>{selectedDeviceCode}-{field.value}</strong>
                                                            </p>
                                                        )}
                                                    </FormItem>
                                                )}
                                            />
                                            <Button type="submit" className="w-full">
                                                Activate Device
                                            </Button>
                                        </form>
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </div>
                        {loading ? (
                            <TableSkeleton rows={6} columns={5} />
                        ) : devices.length === 0 ? (
                            <div className="mt-20">
                                <Empty>
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon">
                                            <Smartphone className="h-14 w-14 text-muted-foreground mx-auto" />
                                        </EmptyMedia>
                                        <EmptyTitle>No devices activated</EmptyTitle>
                                        <EmptyDescription>
                                            You haven&apos;t activated any attendance devices yet. Click &quot;Activate Device&quot; to get started.
                                        </EmptyDescription>
                                    </EmptyHeader>
                                    <EmptyContent>
                                        <Button onClick={() => setActivationOpen(true)}>Activate Device</Button>
                                    </EmptyContent>
                                </Empty>
                            </div>
                        ) : (
                            <DataTable columns={deviceColumns} data={devices} />
                        )}
                    </TabsContent>

                    <TabsContent value="device-types">
                        <div className="items-center my-7">
                            <Dialog open={deviceTypeOpen} onOpenChange={(open) => {
                                setDeviceTypeOpen(open)
                                if (!open) {
                                    setEditingDeviceType(null)
                                    deviceTypeForm.reset()
                                }
                            }}>
                                <DialogTrigger asChild className="float-end ml-5">
                                    <Button>
                                        Add Device Type <Plus className="ml-2" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            {editingDeviceType ? 'Edit' : 'Add'} Device Type
                                        </DialogTitle>
                                    </DialogHeader>
                                    <Form {...deviceTypeForm}>
                                        <form
                                            onSubmit={deviceTypeForm.handleSubmit(handleDeviceTypeSubmit)}
                                            className="space-y-4"
                                        >
                                            <FormField
                                                control={deviceTypeForm.control}
                                                name="code"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Code (e.g., UBIG-101)</FormLabel>
                                                        <FormControl>
                                                            <Input 
                                                                type="text" 
                                                                placeholder="UBIG-101"
                                                                {...field} 
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={deviceTypeForm.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Name</FormLabel>
                                                        <FormControl>
                                                            <Input type="text" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={deviceTypeForm.control}
                                                name="category"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Category</FormLabel>
                                                        <Select
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select category..." />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="rfid">RFID</SelectItem>
                                                                <SelectItem value="biometric">Biometric</SelectItem>
                                                                <SelectItem value="mobile">Mobile</SelectItem>
                                                                <SelectItem value="web">Web</SelectItem>
                                                                <SelectItem value="qr_code">QR Code</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={deviceTypeForm.control}
                                                name="manufacturer"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Manufacturer (Optional)</FormLabel>
                                                        <FormControl>
                                                            <Input type="text" {...field} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={deviceTypeForm.control}
                                                name="model"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Model (Optional)</FormLabel>
                                                        <FormControl>
                                                            <Input type="text" {...field} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <Button type="submit" className="w-full">
                                                {editingDeviceType ? 'Update' : 'Create'}
                                            </Button>
                                        </form>
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </div>
                        {loading ? (
                            <TableSkeleton rows={6} columns={5} />
                        ) : deviceTypes.length === 0 ? (
                            <div className="mt-20">
                                <Empty>
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon">
                                            <Smartphone className="h-14 w-14 text-muted-foreground mx-auto" />
                                        </EmptyMedia>
                                        <EmptyTitle>No device types yet</EmptyTitle>
                                        <EmptyDescription>
                                            Create device types to categorize your attendance devices.
                                        </EmptyDescription>
                                    </EmptyHeader>
                                    <EmptyContent>
                                        <Button onClick={() => setDeviceTypeOpen(true)}>Add Device Type</Button>
                                    </EmptyContent>
                                </Empty>
                            </div>
                        ) : (
                            <DataTable columns={deviceTypeColumns} data={deviceTypes} />
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
