"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { AttendanceForm } from "@/components/form/attendance-form"
import { AlertCircle, Users, FileText } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AddAttendancePage() {
    return (
        <ContentLayout title="Add Manual Attendance">
            <div className="w-full max-w-5xl mx-auto space-y-6">
                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-blue-50 border-blue-200">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-600" />
                                <CardTitle className="text-base text-blue-900">Single Entry</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="text-sm text-blue-800">
                            Tambahkan presensi satu per satu untuk anggota tim.
                        </CardContent>
                    </Card>

                    <Card className="bg-green-50 border-green-200">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-green-600" />
                                <CardTitle className="text-base text-green-900">Batch Entry</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="text-sm text-green-800">
                            Tambahkan multiple presensi sekaligus untuk departemen atau grup.
                        </CardContent>
                    </Card>

                    <Card className="bg-purple-50 border-purple-200">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-purple-600" />
                                <CardTitle className="text-base text-purple-900">Quick Select</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="text-sm text-purple-800">
                            Gunakan tombol quick select atau cari member dengan mudah.
                        </CardContent>
                    </Card>
                </div>

                {/* Tips */}
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Cara Penggunaan</AlertTitle>
                    <AlertDescription>
                        <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                            <li>Filter member berdasarkan department untuk pencarian yang lebih cepat</li>
                            <li>Gunakan tombol "Quick Select" di batch mode untuk menambahkan multiple member sekaligus</li>
                            <li>Status dapat dipilih dengan cepat menggunakan tombol yang tersedia</li>
                            <li>Catatan bersifat opsional tetapi membantu untuk dokumentasi</li>
                        </ul>
                    </AlertDescription>
                </Alert>

                {/* Form */}
                <Card className="md:border-2">
                    <CardHeader>
                        <CardTitle className="text-xl">Tambah Presensi</CardTitle>
                        <CardDescription>
                            Pilih mode Single Entry atau Batch Entry sesuai kebutuhan Anda
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AttendanceForm />
                    </CardContent>
                </Card>
            </div>
        </ContentLayout>
    )
}
