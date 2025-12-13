"use client"

import React, { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, Upload, X, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function MembersImportSimplePage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error("Please upload an Excel or CSV file (.xlsx, .xls, or .csv)")
      return
    }

    setFile(selectedFile)

    try {
      const arrayBuffer = await selectedFile.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
      const fileData = {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        data: base64,
      }
      sessionStorage.setItem(`import_file_${selectedFile.name}`, JSON.stringify(fileData))
    } catch (error) {
      console.error("Error storing file:", error)
    }

    router.push(`/members/import-simple/mapping?file=${encodeURIComponent(selectedFile.name)}`)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) handleFileSelect(droppedFile)
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first")
      return
    }

    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success("File uploaded successfully!")
      setFile(null)
    } catch {
      toast.error("Failed to upload file")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFile(null)
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="w-full px-0 pt-0">
        <div className="flex items-center justify-start pb-3 pt-1 -mx-6 md:-mx-8 px-3 md:px-4 w-full border-b">
          <div className="flex items-center gap-3 -mt-0.5">
            <Button
              onClick={() => {
                if (file) {
                  handleUpload()
                } else {
                  fileInputRef.current?.click()
                }
              }}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Upload className="mr-2 h-4 w-4" />
              {file ? "Process Import" : "Upload Data File"}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={!file || loading}>
              Cancel
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[500px] pt-16 mt-8">
          <div className="relative mb-8 mt-12">
            <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-2xl"></div>
            <div className="relative bg-purple-100 dark:bg-purple-900/30 rounded-full p-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <FileText className="h-16 w-16 text-purple-600 dark:text-purple-400" />
                <div className="absolute -top-2 -right-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`w-full max-w-2xl p-12 transition-colors ${isDragActive ? "bg-primary/5" : ""}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => !loading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0]
                if (selectedFile) handleFileSelect(selectedFile)
              }}
              disabled={loading}
            />

            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Drop or upload a file to import</h2>
              <p className="text-muted-foreground">
                Excel files are recommended as formatting is automatic. But, you can also use .csv files
              </p>
              <div className="pt-2">
                <a
                  href="/templates/members-import-template.xlsx"
                  download
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Download className="h-4 w-4" />
                  Download Template
                </a>
              </div>
            </div>
          </div>

          {file && (
            <div className="mt-6 w-full max-w-2xl">
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setFile(null)} disabled={loading}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}









