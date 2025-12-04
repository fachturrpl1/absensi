"use client"

import React, { useRef, useState } from "react"
import { CloudUpload, Loader2, FileText, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

type Step = "upload" | "mapping" | "processing"

const DATABASE_FIELDS = [
  { key: "email", label: "Email", required: true, description: "Email address (required)" },
  { key: "full_name", label: "Full Name", required: false, description: "Complete name" },
  { key: "phone", label: "Phone Number", required: false, description: "Phone or mobile number" },
  { key: "department", label: "Department/Group", required: false, description: "Department or group name" },
  { key: "position", label: "Position", required: false, description: "Job title or position" },
  { key: "role", label: "Role", required: false, description: "User role (e.g., User, Admin)" },
  { key: "message", label: "Message/Notes", required: false, description: "Additional notes or message" },
] as const

type ColumnMapping = {
  [key: string]: string | null
}

export default function MembersImportPage() {
  const [step, setStep] = useState<Step>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [excelHeaders, setExcelHeaders] = useState<string[]>([])
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [loading, setLoading] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("Please upload an Excel file (.xlsx or .xls)")
      return
    }

    setFile(selectedFile)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/api/members/import/headers", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        toast.error(data.message || "Failed to read Excel file")
        setFile(null)
        return
      }

      setExcelHeaders(data.headers || [])
      setPreview(data.preview || [])
      setTotalRows(data.totalRows || 0)

      // Auto-map common column names
      const autoMapping: ColumnMapping = {}
      DATABASE_FIELDS.forEach((field) => {
        const matchingHeader = data.headers.find((header: string) => {
          const headerLower = header.toLowerCase().trim()
          const fieldLower = field.label.toLowerCase()

          return (
            headerLower === fieldLower ||
            headerLower.includes(fieldLower) ||
            fieldLower.includes(headerLower) ||
            (field.key === "email" && (headerLower.includes("email") || headerLower.includes("surel"))) ||
            (field.key === "phone" && (headerLower.includes("phone") || headerLower.includes("telepon") || headerLower.includes("hp"))) ||
            (field.key === "full_name" && (headerLower.includes("name") || headerLower.includes("nama"))) ||
            (field.key === "department" && (headerLower.includes("department") || headerLower.includes("group") || headerLower.includes("departemen"))) ||
            (field.key === "position" && (headerLower.includes("position") || headerLower.includes("jabatan"))) ||
            (field.key === "role" && (headerLower.includes("role") || headerLower.includes("peran")))
          )
        })

        autoMapping[field.key] = matchingHeader || null
      })

      setMapping(autoMapping)
      setStep("mapping")
      toast.success(`Excel file loaded. Found ${data.totalRows} rows and ${data.headers.length} columns`)
    } catch (error) {
      console.error("Error reading Excel:", error)
      toast.error("Failed to read Excel file")
      setFile(null)
    } finally {
      setLoading(false)
    }
  }

  const validateMapping = () => {
    if (!mapping.email) {
      toast.error("Please map the Email column (required)")
      return false
    }
    return true
  }

  const runImport = async (mode: "test" | "import") => {
    if (!file || !validateMapping()) return

    setStep("processing")
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("mapping", JSON.stringify(mapping))
      formData.append("mode", mode)

      const response = await fetch("/api/members/import/process", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        toast.error(data.message || (mode === "test" ? "Test import failed" : "Import failed"))
        setStep("mapping")
        return
      }

      const summary = data.summary || { success: 0, failed: 0, errors: [] }

      if (mode === "test") {
        // Hanya validasi, tidak ada perubahan data
        toast.success(
          `Test completed. Valid rows: ${summary.success}, Invalid rows: ${summary.failed}`
        )
      } else {
        if (summary.success > 0) {
          toast.success(`Import completed! Success: ${summary.success}, Failed: ${summary.failed}`)
        } else {
          toast.error(`Import failed. ${summary.errors.length} errors occurred.`)
        }
      }
    } catch (error) {
      console.error("Error processing import:", error)
      toast.error(mode === "test" ? "Failed to run test import" : "Failed to process import")
      setStep("mapping")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Step 1 – Upload File</CardTitle>
            <CardDescription>
              Drag &amp; drop Excel file (.xlsx / .xls) atau klik area di bawah. Gunakan template resmi untuk
              meminimalkan error.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 cursor-pointer ${
                isDragActive ? "border-blue-500 bg-blue-50/60" : "border-muted"
              }`}
              onDragEnter={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsDragActive(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsDragActive(false)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsDragActive(false)
                const droppedFile = e.dataTransfer.files?.[0]
                if (droppedFile) handleFileSelect(droppedFile)
              }}
              onClick={() => !loading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0]
                  if (selectedFile) handleFileSelect(selectedFile)
                }}
                disabled={loading}
              />

              {loading ? (
                <>
                  <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Reading Excel file...</p>
                </>
              ) : (
                <>
                  <CloudUpload className="h-12 w-12 text-muted-foreground" />
                  <div className="text-center space-y-1">
                    <p className="text-base font-semibold">Drag & drop your Excel file here</p>
                    <p className="text-sm text-muted-foreground">
                      or click to choose a file from your computer
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
              <p>Need a starter format? Download the official members import template.</p>
              <a
                href="/templates/members-import-template.xlsx"
                download
                className="text-blue-600 hover:underline font-semibold"
              >
                Download Template
              </a>
            </div>
          </CardContent>
        </Card>

        {step !== "upload" && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2 – Mapping & Preview</CardTitle>
              <CardDescription>
                Sesuaikan kolom Excel dengan field di sistem. Baris pertama digunakan sebagai header.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Map Excel columns to database fields. Unmapped fields will be skipped.
                  <strong className="ml-1">Email is required.</strong>
                </AlertDescription>
              </Alert>

              {/* Preview */}
              {preview.length > 0 && (
                <div className="border rounded-lg">
                  <div className="p-3 bg-muted/50 border-b">
                    <p className="text-sm font-medium">
                      Preview (showing first {preview.length} of {totalRows} rows)
                    </p>
                  </div>
                  <ScrollArea className="h-48">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {excelHeaders.map((header) => (
                            <TableHead key={header} className="text-xs">
                              {header}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.map((row, idx) => (
                          <TableRow key={idx}>
                            {excelHeaders.map((header) => (
                              <TableCell key={header} className="text-xs">
                                {String(row[header] || "")}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}

              {/* Mapping form */}
              <div className="space-y-4">
                {DATABASE_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div>
                        <Label className="text-sm font-medium">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {field.description && (
                          <p className="text-xs text-muted-foreground">{field.description}</p>
                        )}
                      </div>
                    </div>
                    <Select
                      value={mapping[field.key] ?? "__UNMAPPED__"}
                      onValueChange={(value) =>
                        setMapping((prev) => ({
                          ...prev,
                          [field.key]: value === "__UNMAPPED__" ? null : value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Excel column (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__UNMAPPED__">-- Not mapped --</SelectItem>
                        {excelHeaders.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => setStep("upload")}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => runImport("test")}
                  disabled={loading}
                >
                  {loading && step === "processing" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Test Import
                    </>
                  )}
                </Button>
                <Button onClick={() => runImport("import")} disabled={loading}>
                  {loading && step === "processing" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Import
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}


