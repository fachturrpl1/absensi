"use client"

import React, { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "@/components/icons/lucide-exports"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

const DATABASE_FIELDS = [
  { key: "first_name", label: "Nama Depan", required: true },
  { key: "last_name", label: "Nama Belakang", required: false },
  { key: "phone", label: "Nomor Telepon", required: false },
  { key: "department_id", label: "Departemen", required: false },
  { key: "is_active", label: "Status", required: false },
] as const


type ColumnMapping = {
  [key: string]: string | null
}

export default function FingerImportSimpleMappingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [file, setFile] = useState<File | null>(null)
  const [excelHeaders, setExcelHeaders] = useState<string[]>([])
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [useFirstRowAsHeader, setUseFirstRowAsHeader] = useState(true)
  const [trackHistory, setTrackHistory] = useState(false)
  const [allowMatchingWithSubfields, setAllowMatchingWithSubfields] = useState(true)
  const [sheetName, setSheetName] = useState("Sheet1")
  const [testSummary, setTestSummary] = useState<{
    success: number
    failed: number
    errors: string[]
  } | null>(null)

  // Load file from URL params or sessionStorage
  useEffect(() => {
    const fileName = searchParams.get("file")
    if (fileName) {
      const fileData = sessionStorage.getItem(`import_file_${fileName}`)
      if (fileData) {
        try {
          const fileBlob = JSON.parse(fileData)
          const binaryString = atob(fileBlob.data)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          const arrayBuffer = bytes.buffer
          const restoredFile = new File([arrayBuffer], fileBlob.name, { type: fileBlob.type })
          setFile(restoredFile)
          loadFileHeaders(restoredFile)
        } catch (error) {
          console.error("Error loading file:", error)
          toast.error("Failed to load file. Please select a new file.")
        }
      }
    }
  }, [searchParams])

  const loadFileHeaders = async (selectedFile: File) => {
    if (!selectedFile) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      // Reuse existing members import API for processing
      const response = await fetch("/api/members/import/headers", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        toast.error(data.message || "Failed to read Excel file")
        return
      }

      setExcelHeaders(data.headers || [])
      setPreview(data.preview || [])
      const autoMapping: ColumnMapping = {}
      DATABASE_FIELDS.forEach((field) => {
        const matchingHeader = data.headers.find((header: string) => {
          const headerLower = header.toLowerCase().trim()
          const fieldLower = field.label.toLowerCase()

          return (
            headerLower === fieldLower ||
            headerLower.includes(fieldLower) ||
            fieldLower.includes(headerLower) ||
            (field.key === "first_name" && (headerLower.includes("first") || headerLower.includes("nama depan"))) ||
            (field.key === "last_name" && (headerLower.includes("last") || headerLower.includes("nama belakang"))) ||
            (field.key === "phone" && (headerLower.includes("phone") || headerLower.includes("telepon") || headerLower.includes("hp"))) ||
            (field.key === "department_id" && (headerLower.includes("department") || headerLower.includes("departemen") || headerLower.includes("divisi"))) ||
            (field.key === "is_active" && (headerLower.includes("active") || headerLower.includes("status")))
          )
        })

        autoMapping[field.key] = matchingHeader || null
      })

      setMapping(autoMapping)
      setTestSummary(null)
      toast.success(`File loaded. Found ${data.totalRows || 0} rows and ${data.headers.length} columns`)
    } catch (error) {
      console.error("Error reading Excel:", error)
      toast.error("Failed to read Excel file")
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error("Please upload an Excel or CSV file (.xlsx, .xls, or .csv)")
      return
    }

    setFile(selectedFile)
    await loadFileHeaders(selectedFile)
  }

  const handleTest = async () => {
    if (!file) {
      toast.error("Please select a file first")
      return
    }

    if (!mapping.first_name) {
      toast.error("Please map the Nama Depan column (required)")
      return
    }

    setProcessing(true)
    setTestSummary(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("mapping", JSON.stringify(mapping))
      formData.append("mode", "test")
      formData.append("trackHistory", String(trackHistory))
      formData.append("allowMatchingWithSubfields", String(allowMatchingWithSubfields))

      const response = await fetch("/api/finger/import/process", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        toast.error(data.message || "Test failed")
        return
      }

      const summary = data.summary || { success: 0, failed: 0, errors: [] }
      setTestSummary(summary)

      if (summary.failed === 0) {
        toast.success(`Test passed! All ${summary.success} rows are valid.`)
      } else {
        toast.warning(`Test completed: ${summary.success} valid, ${summary.failed} errors found`)
      }
    } catch (error) {
      console.error("Error testing import:", error)
      toast.error("Failed to test import")
    } finally {
      setProcessing(false)
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file first")
      return
    }

    if (!mapping.first_name) {
      toast.error("Please map the Nama Depan column (required)")
      return
    }

    setProcessing(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("mapping", JSON.stringify(mapping))
      formData.append("mode", "import")
      formData.append("trackHistory", String(trackHistory))
      formData.append("allowMatchingWithSubfields", String(allowMatchingWithSubfields))

      const response = await fetch("/api/members/import/process", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        toast.error(data.message || "Import failed")
        return
      }

      const summary = data.summary || { success: 0, failed: 0, errors: [] }

      if (summary.failed === 0) {
        toast.success(`Import completed! ${summary.success} rows imported.`)
      } else {
        toast.warning(`Import completed with ${summary.failed} errors.`)
      }

      router.push("/finger")
    } catch (error) {
      console.error("Error importing members:", error)
      toast.error("Failed to import data")
    } finally {
      setProcessing(false)
    }
  }

  const getPreviewValue = (header: string) => {
    const firstRow = preview[0]
    return firstRow?.[header] || ""
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-6 pt-0">
        {/* Header buttons */}
        <div className="flex items-center justify-start pb-4 pt-4 relative">
          <div className="absolute bottom-0 left-0 right-0 border-b" style={{ left: "-24px", right: "-24px" }}></div>
          <div className="flex items-center gap-4 w-full">
            <Button
              onClick={handleImport}
              disabled={!file || processing || !mapping.first_name}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Import"
              )}
            </Button>
            <Button
              onClick={handleTest}
              disabled={!file || processing || !mapping.first_name}
              variant="outline"
            >
              Test
            </Button>
            <Button
              onClick={async () => {
                if (file) {
                  await loadFileHeaders(file)
                } else {
                  router.push("/finger/import-simple")
                }
              }}
              disabled={processing || loading}
              variant="outline"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Refresh"
              )}
            </Button>
            <Button
              onClick={() => router.push("/finger/import-simple")}
              disabled={processing}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0]
            if (selectedFile) handleFileSelect(selectedFile)
          }}
          disabled={loading || processing}
        />

        <div className="flex relative">
          <div className="absolute bottom-0 left-0 right-0 border-b" style={{ left: "-24px", right: "-24px" }}></div>

          {/* Left panel */}
          <div className="w-80 pr-6 border-r pt-6 pb-6 relative z-10" style={{ marginTop: "-1px" }}>
            <div className="space-y-4 pb-6 border-b">
              <h2 className="font-semibold text-lg">Data to import</h2>

              {file ? (
                <>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">File:</p>
                    <p className="text-sm">{file.name}</p>
                  </div>

                  <div>
                    <Label htmlFor="sheet" className="text-sm font-medium text-muted-foreground mb-2 block">
                      Sheet:
                    </Label>
                    <Select value={sheetName} onValueChange={setSheetName}>
                      <SelectTrigger id="sheet">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sheet1">Sheet1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="use-header"
                      checked={useFirstRowAsHeader}
                      onCheckedChange={(checked) => setUseFirstRowAsHeader(checked === true)}
                    />
                    <Label htmlFor="use-header" className="text-sm cursor-pointer">
                      Use first row as header
                    </Label>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No file selected</p>
              )}
            </div>

            <div className="space-y-4 pt-6">
              <h2 className="font-semibold text-lg">Advanced</h2>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="track-history"
                  checked={trackHistory}
                  onCheckedChange={(checked) => setTrackHistory(checked === true)}
                />
                <Label htmlFor="track-history" className="text-sm cursor-pointer">
                  Track history during import
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allow-matching"
                  checked={allowMatchingWithSubfields}
                  onCheckedChange={(checked) => setAllowMatchingWithSubfields(checked === true)}
                />
                <Label htmlFor="allow-matching" className="text-sm cursor-pointer">
                  Allow matching with subfields
                </Label>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="flex-1 pl-6 pt-6 pb-6 relative z-10">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : excelHeaders.length > 0 ? (
              <div>
                <ScrollArea className="h-[calc(100vh-250px)]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">File Column</TableHead>
                        <TableHead>Database Field</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {excelHeaders.map((header) => {
                        const mappedField = Object.keys(mapping).find((key) => mapping[key] === header)
                        const previewValue = getPreviewValue(header)

                        return (
                          <TableRow key={header}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{header}</p>
                                {previewValue && (
                                  <p className="text-xs text-muted-foreground mt-1">{previewValue}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                      <Select
                        value={mappedField || "__UNMAPPED__"}
                        onValueChange={(value) => {
                          if (value === "__UNMAPPED__") {
                            const newMapping = { ...mapping }
                            Object.keys(newMapping).forEach((key) => {
                              if (newMapping[key] === header) {
                                delete newMapping[key]
                              }
                            })
                            setMapping(newMapping)
                          } else {
                            const newMapping = { ...mapping }
                            Object.keys(newMapping).forEach((key) => {
                              if (newMapping[key] === header && key !== value) {
                                delete newMapping[key]
                              }
                            })
                            newMapping[value] = header
                            setMapping(newMapping)
                          }
                        }}
                      >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select database field" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__UNMAPPED__">-- Not Mapped --</SelectItem>
                                  {DATABASE_FIELDS.map((field) => (
                                    <SelectItem key={field.key} value={field.key}>
                                      {field.label}
                                      {field.required ? " *" : ""}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data to map. Please upload a file first.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

