"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// 1. Schema validasi
const formSchema = z.object({
    date: z.string().min(1, "Tanggal wajib diisi."),
    time: z.string().min(1, "Waktu wajib diisi."),
    student_name: z.string().min(2, "Nama siswa minimal 2 karakter."),
    status: z.string("Status wajib diisi.").min(1, "Status wajib diisi."),

    remarks: z.string().optional(),
})


export function AttendanceForm() {
    // 2. Inisialisasi form
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            date: "",
            student_name: "",
            status: "present",
            remarks: "",
        },
    })

    // 3. Submit handler
    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log("Form submitted:", values)
        // TODO: Kirim ke backend (fetch/axios ke Laravel API)
    }

    // 4. Render form
    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}

            >
                {/* Date */}
                <Card >
                    <CardHeader>
                        <CardTitle>Create Attendance</CardTitle>
                        <CardDescription>Enter members attendance data</CardDescription>
                    </CardHeader>
                   
                  <CardContent className="grid grid-cols-2 gap-6 gap-y-8 mb-8">
                        <FormField 
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="time"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Time</FormLabel>
                                    <FormControl>
                                        <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Student Name */}
                        <FormField
                            control={form.control}
                            name="student_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Members</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nama Members" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Status */}
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl className="w-full">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="present">Present</SelectItem>
                                            <SelectItem value="absent">Absent</SelectItem>
                                            <SelectItem value="late">Late</SelectItem>
                                            <SelectItem value="excused">Excused</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                   </CardContent>
                </Card>
                <div className="flex gap-4 col-span-2 mt-8 justify-end">
                    
                    <Button type="submit" className=" " variant="outline">
                        Cancel
                    </Button>
                    <Button type="submit" className=" ">
                        Create
                    </Button>
                </div>

            </form>
        </Form>
    )
}
