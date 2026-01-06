"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Wizard, WizardStep } from "@/components/ui/wizard"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  FileSpreadsheet, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  Users,
  Search,
  Filter,
  X,
  GripVertical
} from "lucide-react"
import { toast } from "sonner"
import { useHydration } from "@/hooks/useHydration"
import { useGroups } from "@/hooks/use-groups"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

const WIZARD_STEPS: WizardStep[] = [
  { number: 1, title: "Pilih Data", description: "Ringkasan data yang akan diexport" },
  { number: 2, title: "Konfigurasi Export", description: "Pilih format dan kolom" },
  { number: 3, title: "Preview Data", description: "Preview hasil export" },
  { number: 4, title: "Proses Export", description: "Sedang memproses export" },
  { number: 5, title: "Result", description: "Hasil export" },
]

// Available export fields - ONLY from biodata table
const EXPORT_FIELDS = [
  { key: "nik", label: "NIK", default: true },
  { key: "nama", label: "Nama Lengkap", default: true },
  { key: "nickname", label: "Nickname", default: false },
  { key: "nisn", label: "NISN", default: false },
  { key: "jenis_kelamin", label: "Jenis Kelamin", default: false },
  { key: "tempat_lahir", label: "Tempat Lahir", default: false },
  { key: "tanggal_lahir", label: "Tanggal Lahir", default: false },
  { key: "agama", label: "Agama", default: false },
  { key: "jalan", label: "Jalan", default: false },
  { key: "rt", label: "RT", default: false },
  { key: "rw", label: "RW", default: false },
  { key: "dusun", label: "Dusun", default: false },
  { key: "kelurahan", label: "Kelurahan", default: false },
  { key: "kecamatan", label: "Kecamatan", default: false },
  { key: "no_telepon", label: "No. Telepon", default: false },
  { key: "email", label: "Email", default: true },
  { key: "department_id", label: "Group", default: false },
] as const

type ExportFormat = "xlsx" | "csv"
type ExportConfig = {
  format: ExportFormat
  selectedFields: string[]
  includeHeader: boolean
  dateFormat: string
}

export default function MembersExportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isHydrated, organizationId } = useHydration()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: "xlsx",
    selectedFields: EXPORT_FIELDS.filter(f => f.default).map(f => f.key),
    includeHeader: true,
    dateFormat: "YYYY-MM-DD",
  })
  const [previewData, setPreviewData] = useState<Record<string, any>[]>([])
  const [memberRows, setMemberRows] = useState<Record<string, any>[]>([]) // Data untuk tabel di Step 1
  const [totalCount, setTotalCount] = useState(0)
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set()) // Indeks row yang dipilih
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(1000) // Maksimal 1000 data per halaman
  const [exportResult, setExportResult] = useState<{
    success: boolean
    fileUrl?: string
    fileName?: string
    exportedCount?: number
    message?: string
  } | null>(null)

  // Filter states - dynamic filter system (like Supabase)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [filters, setFilters] = useState<Array<{
    id: string
    column: string
    values: string[]
  }>>([])
  const [showAddFilterPopover, setShowAddFilterPopover] = useState(false)
  const [editingFilterId, setEditingFilterId] = useState<string | null>(null)
  const [filterOptions, setFilterOptions] = useState<Record<string, Array<{ value: string; label: string }>>>({})
  const [loadingFilterOptions, setLoadingFilterOptions] = useState<Record<string, boolean>>({})
  // State untuk 2-step filter (pilih kolom → pilih nilai + Apply)
  const [selectedColumnForFilter, setSelectedColumnForFilter] = useState<string | null>(null)
  const [tempNewFilterValues, setTempNewFilterValues] = useState<string[]>([])
  
  // Load groups
  const { data: groups = [] } = useGroups({
    enabled: isHydrated && !!organizationId
  })

  // Load filter options from database
  const loadFilterOptions = React.useCallback(async (columnKey: string) => {
    if (!organizationId || !columnKey) return
    if (filterOptions[columnKey] || loadingFilterOptions[columnKey]) return
    
    setLoadingFilterOptions(prev => ({ ...prev, [columnKey]: true }))
    try {
      const url = new URL("/api/members/export/filter-options", window.location.origin)
      url.searchParams.set("organizationId", String(organizationId))
      url.searchParams.set("column", columnKey)

      const res = await fetch(url.toString(), { credentials: "same-origin" })
      const json = await res.json()
      
      if (json.success) {
        setFilterOptions(prev => ({
          ...prev,
          [columnKey]: json.options || []
        }))
      }
    } catch (error) {
      console.error("Error loading filter options:", error)
    } finally {
      setLoadingFilterOptions(prev => ({ ...prev, [columnKey]: false }))
    }
  }, [organizationId, filterOptions, loadingFilterOptions])

  // Available filter columns (exclude already selected ones)
  const getAvailableFilterColumns = () => {
    const usedColumns = new Set(filters.map(f => f.column))
    return [
      { 
        key: "group", 
        label: "Group / Department", 
        options: groups.map(g => ({ value: String(g.id), label: g.name })) 
      },
      { 
        key: "jenis_kelamin", 
        label: "Jenis Kelamin", 
        options: filterOptions.jenis_kelamin || []
      },
      { 
        key: "agama", 
        label: "Agama", 
        options: filterOptions.agama || []
      },
    ].filter(col => !usedColumns.has(col.key))
  }

  // Get filter values for API
  const getFilterParams = () => {
    const params: Record<string, string[]> = {}
    filters.forEach(filter => {
      if (filter.column === "group") {
        params.groups = filter.values
      } else if (filter.column === "jenis_kelamin") {
        params.genders = filter.values
      } else if (filter.column === "agama") {
        params.agamas = filter.values
      } else if (filter.column === "status") {
        params.status = filter.values
      }
    })
    return params
  }

  // Add new filter - Step 1: Pilih kolom, lalu buka panel untuk pilih nilai
  const selectColumnForFilter = (columnKey: string) => {
    // Load filter options if needed
    if (columnKey !== "group" && !filterOptions[columnKey]) {
      loadFilterOptions(columnKey)
    }
    setSelectedColumnForFilter(columnKey)
    setTempNewFilterValues([])
    // Popover tetap terbuka untuk menampilkan panel nilai
  }

  // Apply new filter - Step 2: Setelah pilih nilai, klik Apply
  const applyNewFilter = () => {
    if (!selectedColumnForFilter || tempNewFilterValues.length === 0) {
      toast.error("Pilih minimal satu nilai untuk filter")
      return
    }
    const filterId = `${selectedColumnForFilter}-${Date.now()}`
    setFilters(prev => [...prev, { id: filterId, column: selectedColumnForFilter, values: tempNewFilterValues }])
    setSelectedColumnForFilter(null)
    setTempNewFilterValues([])
    setShowAddFilterPopover(false)
  }

  // Remove filter
  const removeFilter = (filterId: string) => {
    setFilters(prev => prev.filter(f => f.id !== filterId))
  }

  // Update filter values
  const updateFilterValues = (filterId: string, values: string[]) => {
    setFilters(prev => prev.map(f => f.id === filterId ? { ...f, values } : f))
  }

  // Get filter column config
  const getFilterColumnConfig = (columnKey: string) => {
    const allColumns = [
      { 
        key: "group", 
        label: "Group / Department", 
        options: groups.map(g => ({ value: String(g.id), label: g.name })) 
      },
      { 
        key: "jenis_kelamin", 
        label: "Jenis Kelamin", 
        options: filterOptions.jenis_kelamin || []
      },
      { 
        key: "agama", 
        label: "Agama", 
        options: filterOptions.agama || []
      },
    ]
    return allColumns.find(col => col.key === columnKey)
  }

  // Load filter options on mount
  useEffect(() => {
    if (isHydrated && organizationId) {
      loadFilterOptions("agama")
      loadFilterOptions("jenis_kelamin")
    }
  }, [isHydrated, organizationId, loadFilterOptions])

  // Step 1: Load member data summary and rows
  useEffect(() => {
    if (currentStep === 1 && isHydrated && organizationId) {
      loadMemberSummary()
      loadMemberRows()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, isHydrated, organizationId, searchQuery, filters, currentPage])

  const loadMemberSummary = async () => {
    setLoading(true)
    try {
      const url = new URL("/api/members/export/count", window.location.origin)
      if (organizationId) url.searchParams.set("organizationId", String(organizationId))
      if (searchQuery) url.searchParams.set("search", searchQuery)
      
      const filterParams = getFilterParams()
      if (filterParams.groups?.length) url.searchParams.set("groups", filterParams.groups.join(","))
      if (filterParams.genders?.length) url.searchParams.set("genders", filterParams.genders.join(","))
      if (filterParams.agamas?.length) url.searchParams.set("agamas", filterParams.agamas.join(","))
      if (filterParams.status?.length) {
        const status = filterParams.status[0] // Status is single value
        if (status) {
          url.searchParams.set("active", status)
        }
      }

      const res = await fetch(url.toString(), { credentials: "same-origin" })
      const json = await res.json()
      
      if (json.success) {
        setTotalCount(json.count || 0)
      } else {
        toast.error(json.message || "Gagal memuat data member")
      }
    } catch (error) {
      console.error("Error loading member summary:", error)
      toast.error("Gagal memuat data member")
    } finally {
      setLoading(false)
    }
  }

  const loadMemberRows = async () => {
    setLoadingMembers(true)
    try {
      const url = new URL("/api/members/export/rows", window.location.origin)
      if (organizationId) url.searchParams.set("organizationId", String(organizationId))
      if (searchQuery) url.searchParams.set("search", searchQuery)
      url.searchParams.set("page", String(currentPage))
      url.searchParams.set("pageSize", String(pageSize))
      
      const filterParams = getFilterParams()
      if (filterParams.groups?.length) url.searchParams.set("groups", filterParams.groups.join(","))
      if (filterParams.genders?.length) url.searchParams.set("genders", filterParams.genders.join(","))
      if (filterParams.agamas?.length) url.searchParams.set("agamas", filterParams.agamas.join(","))
      if (filterParams.status?.length && filterParams.status[0]) {
        const status = filterParams.status[0]
        url.searchParams.set("active", status)
      }

      const res = await fetch(url.toString(), { credentials: "same-origin" })
      const json = await res.json()
      
      if (json.success) {
        setMemberRows(json.data || [])
        // Reset selected rows saat ganti halaman
        setSelectedRows(new Set())
      } else {
        toast.error(json.message || "Gagal memuat data member")
      }
    } catch (error) {
      console.error("Error loading member rows:", error)
      toast.error("Gagal memuat data member")
    } finally {
      setLoadingMembers(false)
    }
  }

  const toggleRowSelection = (index: number) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedRows.size === memberRows.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(memberRows.map((_, idx) => idx)))
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  // Step 3: Load preview data (gunakan API rows agar konsisten dengan Data Member)
  const loadPreviewData = async () => {
    setLoading(true)
    // Jika user sudah memilih baris tertentu di Step 1,
    // preview cukup menampilkan baris yang dipilih saja (maks 10 baris),
    // supaya sesuai ekspektasi bahwa hanya data terpilih yang akan diexport.
    if (selectedRows.size > 0 && memberRows.length > 0) {
      const selected = memberRows
        .filter((_, idx) => selectedRows.has(idx))
        .slice(0, 10)
      setPreviewData(selected)
      setLoading(false)
      return
    }

    try {
      const url = new URL("/api/members/export/rows", window.location.origin)
      if (organizationId) url.searchParams.set("organizationId", String(organizationId))
      if (searchQuery) url.searchParams.set("search", searchQuery)
      // Preview selalu ambil halaman pertama, maksimal 10 baris
      url.searchParams.set("page", "1")
      url.searchParams.set("pageSize", "10")
      
      const filterParams = getFilterParams()
      if (filterParams.groups?.length) url.searchParams.set("groups", filterParams.groups.join(","))
      if (filterParams.genders?.length) url.searchParams.set("genders", filterParams.genders.join(","))
      if (filterParams.agamas?.length) url.searchParams.set("agamas", filterParams.agamas.join(","))
      if (filterParams.status?.length) {
        const status = filterParams.status[0]
        if (status) {
          url.searchParams.set("active", status)
        }
      }

      const res = await fetch(url.toString(), { credentials: "same-origin" })
      const json = await res.json()
      
      if (json.success) {
        setPreviewData(json.data || [])
      } else {
        toast.error(json.message || "Gagal memuat preview data")
      }
    } catch (error) {
      console.error("Error loading preview:", error)
      toast.error("Gagal memuat preview data")
    } finally {
      setLoading(false)
    }
  }

  // Step 4: Process export
  const processExport = async () => {
    setExporting(true)
    try {
      // Ambil NIK dari row yang dipilih
      const selectedNiks = Array.from(selectedRows)
        .map(idx => memberRows[idx]?.nik)
        .filter(nik => nik) // Filter NIK yang valid
      
      if (selectedNiks.length === 0) {
        toast.error("Tidak ada data yang dipilih untuk diexport")
        setExporting(false)
        return
      }

      const url = new URL("/api/members/export", window.location.origin)
      url.searchParams.set("format", exportConfig.format)
      url.searchParams.set("includeHeader", String(exportConfig.includeHeader))
      url.searchParams.set("dateFormat", exportConfig.dateFormat)
      if (organizationId) url.searchParams.set("organizationId", String(organizationId))
      
      // Kirim NIK yang dipilih
      url.searchParams.set("selectedNiks", selectedNiks.join(","))
      
      url.searchParams.set("fields", exportConfig.selectedFields.join(","))

      const res = await fetch(url.toString(), { credentials: "same-origin" })
      
      if (!res.ok) {
        throw new Error("Export failed")
      }

      // Get blob and create download link
      const blob = await res.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const fileName = `members-export-${new Date().toISOString().split("T")[0]}.${exportConfig.format}`
      
      // Trigger download
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      // Get count from selected rows
      const exportedCount = selectedNiks.length

      setExportResult({
        success: true,
        fileName,
        exportedCount,
        message: "Export berhasil!",
      })

      toast.success("Export berhasil!")
      setCurrentStep(5)
    } catch (error) {
      console.error("Error exporting:", error)
      setExportResult({
        success: false,
        message: "Gagal melakukan export. Silakan coba lagi.",
      })
      toast.error("Gagal melakukan export")
    } finally {
      setExporting(false)
    }
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (totalCount === 0) {
        toast.error("Tidak ada data untuk diexport")
        return
      }
      if (selectedRows.size === 0) {
        toast.error("Pilih minimal satu data member terlebih dahulu")
        return
      }
      setCurrentStep(2)
    } else if (currentStep === 2) {
      if (exportConfig.selectedFields.length === 0) {
        toast.error("Pilih minimal satu kolom untuk diexport")
        return
      }
      setCurrentStep(3)
      loadPreviewData()
    } else if (currentStep === 3) {
      setCurrentStep(4)
      processExport()
    } else if (currentStep === 4) {
      // This step is automatic, handled by processExport
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1 && currentStep !== 4) {
      setCurrentStep(currentStep - 1)
    }
  }

  const toggleField = (fieldKey: string) => {
    setExportConfig(prev => ({
      ...prev,
      selectedFields: prev.selectedFields.includes(fieldKey)
        ? prev.selectedFields.filter(f => f !== fieldKey)
        : [...prev.selectedFields, fieldKey]
    }))
  }

  const canGoNext = () => {
    if (currentStep === 1) return totalCount > 0 && selectedRows.size > 0
    if (currentStep === 2) return exportConfig.selectedFields.length > 0
    if (currentStep === 3) return true
    if (currentStep === 4) return false // Auto-progress
    return false
  }

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/members">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Export Data Member</h1>
            <p className="text-muted-foreground">
              Export data member ke file Excel atau CSV dengan proses bertahap
            </p>
          </div>
        </div>

        <Wizard
          steps={WIZARD_STEPS}
          currentStep={currentStep}
          onNext={currentStep !== 4 ? handleNext : undefined}
          onPrevious={currentStep !== 4 ? handlePrevious : undefined}
          canGoNext={canGoNext()}
          canGoPrevious={currentStep > 1 && currentStep !== 4}
          showNavigation={currentStep !== 4}
        >
          {/* Step 1: Select Data */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filter
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add Filter Button - 2-step seperti Supabase */}
                  <div className="space-y-2">
                    <Label>Filter</Label>
                    <Popover 
                      open={showAddFilterPopover} 
                      onOpenChange={(open) => {
                        setShowAddFilterPopover(open)
                        if (!open) {
                          setSelectedColumnForFilter(null)
                          setTempNewFilterValues([])
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <Filter className="mr-2 h-4 w-4" />
                          {filters.length === 0 ? "Pick a column to filter by" : "Add filter"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[320px] p-0" align="start">
                        {!selectedColumnForFilter ? (
                          // Step 1: Pilih kolom
                          <Command>
                            <CommandInput placeholder="Cari kolom..." />
                            <CommandList>
                              <CommandEmpty>Kolom tidak ditemukan</CommandEmpty>
                              <CommandGroup>
                                {getAvailableFilterColumns().map((column) => (
                                  <CommandItem
                                    key={column.key}
                                    onSelect={() => {
                                      selectColumnForFilter(column.key)
                                    }}
                                  >
                                    {column.label}
                                  </CommandItem>
                                ))}
                                {getAvailableFilterColumns().length === 0 && (
                                  <div className="p-4 text-center text-sm text-muted-foreground">
                                    Semua filter sudah ditambahkan
                                  </div>
                                )}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        ) : (
                          // Step 2: Pilih nilai + Apply button
                          <Command>
                            <div className="flex items-center justify-between px-3 py-2.5 border-b">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:bg-muted"
                                  onClick={() => {
                                    setSelectedColumnForFilter(null)
                                    setTempNewFilterValues([])
                                  }}
                                >
                                  <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm font-medium">
                                  {getFilterColumnConfig(selectedColumnForFilter)?.label || "Nilai"}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                className="h-7 px-3 text-xs"
                                onClick={applyNewFilter}
                                disabled={tempNewFilterValues.length === 0}
                              >
                                Apply filter
                              </Button>
                            </div>
                            {getFilterColumnConfig(selectedColumnForFilter)?.options.length && 
                             getFilterColumnConfig(selectedColumnForFilter)!.options.length > 5 && (
                              <CommandInput 
                                placeholder={`Cari ${getFilterColumnConfig(selectedColumnForFilter)?.label.toLowerCase()}...`} 
                                className="h-9"
                              />
                            )}
                            <CommandList className="max-h-[280px]">
                              <CommandEmpty>
                                {loadingFilterOptions[selectedColumnForFilter] 
                                  ? "Memuat opsi..." 
                                  : "Tidak ada pilihan"}
                              </CommandEmpty>
                              <CommandGroup>
                                {loadingFilterOptions[selectedColumnForFilter] ? (
                                  <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  </div>
                                ) : (
                                  getFilterColumnConfig(selectedColumnForFilter)?.options.map((option) => {
                                    const checked = tempNewFilterValues.includes(option.value)
                                    return (
                                      <CommandItem
                                        key={option.value}
                                        value={option.value}
                                        onSelect={() => {
                                          const newValues = checked
                                            ? tempNewFilterValues.filter(v => v !== option.value)
                                            : [...tempNewFilterValues, option.value]
                                          setTempNewFilterValues(newValues)
                                        }}
                                        className="flex items-center gap-2 py-2"
                                      >
                                        <Checkbox
                                          checked={checked}
                                          onCheckedChange={(isChecked) => {
                                            const newValues = isChecked
                                              ? [...tempNewFilterValues, option.value]
                                              : tempNewFilterValues.filter(v => v !== option.value)
                                            setTempNewFilterValues(newValues)
                                          }}
                                        />
                                        <span className="text-sm">{option.label}</span>
                                      </CommandItem>
                                    )
                                  })
                                )}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Active Filters */}
                  {filters.length > 0 && (
                    <div className="space-y-2">
                      <Label>Filter Aktif</Label>
                      <div className="flex flex-wrap gap-2">
                        {filters.map((filter) => {
                          const columnConfig = getFilterColumnConfig(filter.column)
                          const selectedLabels = filter.values
                            .map(val => {
                              if (filter.column === "group") {
                                const group = groups.find(g => String(g.id) === val)
                                return group?.name || val
                              }
                              return columnConfig?.options.find(opt => opt.value === val)?.label || val
                            })
                            .join(", ")

                          return (
                            <div key={filter.id} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <div className="flex items-center gap-1">
                                <span className="font-medium text-sm">{columnConfig?.label}:</span>
                                <span className="text-sm text-muted-foreground">
                                  {filter.values.length > 0 ? selectedLabels : "Pilih nilai..."}
                                </span>
                              </div>
                              <Popover open={editingFilterId === filter.id} onOpenChange={(open) => {
                                if (open) {
                                  setEditingFilterId(filter.id)
                                } else {
                                  setEditingFilterId(null)
                                }
                              }}>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 px-2">
                                    Edit
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="start">
                                  <Command>
                                    <div className="px-3 py-2 border-b">
                                      <span className="text-sm font-medium">
                                        {columnConfig?.label || "Nilai"}
                                      </span>
                                    </div>

                                    {columnConfig && columnConfig.options.length > 5 && (
                                      <CommandInput placeholder={`Cari ${columnConfig.label.toLowerCase()}...`} />
                                    )}
                                    <CommandList>
                                      <CommandEmpty>
                                        {loadingFilterOptions[filter.column] 
                                          ? "Memuat opsi..." 
                                          : "Tidak ada pilihan"}
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {loadingFilterOptions[filter.column] ? (
                                          <div className="flex items-center justify-center py-4">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          </div>
                                        ) : (
                                          columnConfig?.options.map((option) => {
                                            const checked = filter.values.includes(option.value)
                                            return (
                                              <CommandItem
                                                key={option.value}
                                                value={option.value}
                                                // Edit langsung - langsung update filter saat checkbox diubah
                                                onSelect={() => {
                                                  const newValues = checked
                                                    ? filter.values.filter(v => v !== option.value)
                                                    : [...filter.values, option.value]
                                                  updateFilterValues(filter.id, newValues)
                                                }}
                                                className="flex items-center gap-2"
                                              >
                                                <Checkbox
                                                  checked={checked}
                                                  onCheckedChange={(isChecked) => {
                                                    const newValues = isChecked
                                                      ? [...filter.values, option.value]
                                                      : filter.values.filter(v => v !== option.value)
                                                    updateFilterValues(filter.id, newValues)
                                                  }}
                                                />
                                                {option.label}
                                              </CommandItem>
                                            )
                                          })
                                        )}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => removeFilter(filter.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Data Member
                  </CardTitle>
                  <CardDescription>
                    Menampilkan {totalCount.toLocaleString()} row member berdasarkan filter aktif
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading || loadingMembers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Search - affects Data Member table */}
                      <div className="space-y-2">
                        <Label>Search Member</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Cari nama, NIK, email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                      </div>

                      {(searchQuery || filters.length > 0) && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Filter Aktif:</strong>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              {searchQuery && <li>Search: "{searchQuery}"</li>}
                              {filters.map(filter => {
                                const columnConfig = getFilterColumnConfig(filter.column)
                                return (
                                  <li key={filter.id}>
                                    {columnConfig?.label}: {filter.values.length} nilai dipilih
                                  </li>
                                )
                              })}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}

                      {totalCount === 0 ? (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Tidak ada data member yang sesuai dengan filter. Silakan ubah filter atau kembali ke halaman member.
                          </AlertDescription>
                        </Alert>
                      ) : (
                         <div className="space-y-2">
                           <div className="flex items-center justify-between">
                             <Label>Data Member ({totalCount.toLocaleString()} rows total, halaman {currentPage} dari {totalPages})</Label>
                             <div className="flex items-center gap-2">
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={toggleSelectAll}
                                 disabled={memberRows.length === 0}
                               >
                                 {selectedRows.size === memberRows.length && memberRows.length > 0
                                   ? "Hapus Semua"
                                   : "Pilih Semua"}
                               </Button>
                               {selectedRows.size > 0 && (
                                 <Badge variant="secondary">
                                   {selectedRows.size} dipilih
                                 </Badge>
                               )}
                             </div>
                           </div>
                           <div 
                             className="border rounded-lg overflow-auto custom-scrollbar" 
                             style={{ 
                               maxHeight: '500px'
                             }}
                           >
                             <Table>
                               <TableHeader className="sticky top-0 bg-background z-10">
                                 <TableRow>
                                   <TableHead className="w-12">
                                     <Checkbox
                                       checked={selectedRows.size === memberRows.length && memberRows.length > 0}
                                       onCheckedChange={toggleSelectAll}
                                     />
                                   </TableHead>
                                   <TableHead className="whitespace-nowrap">NIK</TableHead>
                                   <TableHead className="whitespace-nowrap">Nama</TableHead>
                                   <TableHead className="whitespace-nowrap">Nickname</TableHead>
                                   <TableHead className="whitespace-nowrap">NISN</TableHead>
                                   <TableHead className="whitespace-nowrap">Jenis Kelamin</TableHead>
                                   <TableHead className="whitespace-nowrap">Tempat Lahir</TableHead>
                                   <TableHead className="whitespace-nowrap">Tanggal Lahir</TableHead>
                                   <TableHead className="whitespace-nowrap">Agama</TableHead>
                                   <TableHead className="whitespace-nowrap">Jalan</TableHead>
                                   <TableHead className="whitespace-nowrap">RT</TableHead>
                                   <TableHead className="whitespace-nowrap">RW</TableHead>
                                   <TableHead className="whitespace-nowrap">Dusun</TableHead>
                                   <TableHead className="whitespace-nowrap">Kelurahan</TableHead>
                                   <TableHead className="whitespace-nowrap">Kecamatan</TableHead>
                                   <TableHead className="whitespace-nowrap">No. Telepon</TableHead>
                                   <TableHead className="whitespace-nowrap">Email</TableHead>
                                   <TableHead className="whitespace-nowrap">Group</TableHead>
                                 </TableRow>
                               </TableHeader>
                               <TableBody>
                                 {memberRows.length === 0 ? (
                                   <TableRow>
                                     <TableCell colSpan={17} className="text-center py-8 text-muted-foreground">
                                       Tidak ada data
                                     </TableCell>
                                   </TableRow>
                                 ) : (
                                   memberRows.map((row, idx) => (
                                     <TableRow key={idx}>
                                       <TableCell>
                                         <Checkbox
                                           checked={selectedRows.has(idx)}
                                           onCheckedChange={() => toggleRowSelection(idx)}
                                         />
                                       </TableCell>
                                       <TableCell className="whitespace-nowrap">{row.nik || "-"}</TableCell>
                                       <TableCell className="whitespace-nowrap">{row.nama || "-"}</TableCell>
                                       <TableCell className="whitespace-nowrap">{row.nickname || "-"}</TableCell>
                                       <TableCell className="whitespace-nowrap">{row.nisn || "-"}</TableCell>
                                       <TableCell className="whitespace-nowrap">{row.jenis_kelamin || "-"}</TableCell>
                                       <TableCell className="whitespace-nowrap">{row.tempat_lahir || "-"}</TableCell>
                                       <TableCell className="whitespace-nowrap">{row.tanggal_lahir || "-"}</TableCell>
                                       <TableCell className="whitespace-nowrap">{row.agama || "-"}</TableCell>
                                       <TableCell className="whitespace-nowrap">{row.jalan || "-"}</TableCell>
                                       <TableCell className="whitespace-nowrap">{row.rt || "-"}</TableCell>
                                       <TableCell className="whitespace-nowrap">{row.rw || "-"}</TableCell>
                                       <TableCell className="whitespace-nowrap">{row.dusun || "-"}</TableCell>
                                       <TableCell className="whitespace-nowrap">{row.kelurahan || "-"}</TableCell>
                                       <TableCell className="whitespace-nowrap">{row.kecamatan || "-"}</TableCell>
                                       <TableCell className="whitespace-nowrap">{row.no_telepon || "-"}</TableCell>
                                       <TableCell className="whitespace-nowrap">{row.email || "-"}</TableCell>
                                       <TableCell className="whitespace-nowrap">{row.department_id || "-"}</TableCell>
                                     </TableRow>
                                   ))
                                 )}
                               </TableBody>
                               </Table>
                           </div>
                           {/* Pagination */}
                           {totalPages > 1 && (
                             <div className="flex items-center justify-between mt-4">
                               <div className="text-sm text-muted-foreground">
                                 Menampilkan {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} dari {totalCount.toLocaleString()} data
                               </div>
                               <div className="flex items-center gap-2">
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                   disabled={currentPage === 1 || loadingMembers}
                                 >
                                   Sebelumnya
                                 </Button>
                                 <div className="flex items-center gap-1">
                                   {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                     let pageNum: number
                                     if (totalPages <= 5) {
                                       pageNum = i + 1
                                     } else if (currentPage <= 3) {
                                       pageNum = i + 1
                                     } else if (currentPage >= totalPages - 2) {
                                       pageNum = totalPages - 4 + i
                                     } else {
                                       pageNum = currentPage - 2 + i
                                     }
                                     return (
                                       <Button
                                         key={pageNum}
                                         variant={currentPage === pageNum ? "default" : "outline"}
                                         size="sm"
                                         onClick={() => setCurrentPage(pageNum)}
                                         disabled={loadingMembers}
                                       >
                                         {pageNum}
                                       </Button>
                                     )
                                   })}
                                 </div>
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                   disabled={currentPage === totalPages || loadingMembers}
                                 >
                                   Selanjutnya
                                 </Button>
                               </div>
                             </div>
                           )}
                         </div>
                       )}
                     </div>
                   )}
                 </CardContent>
               </Card>
             </div>
           )}

          {/* Step 2: Configure Export */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Format Export</CardTitle>
                  <CardDescription>Pilih format file yang diinginkan</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={exportConfig.format}
                    onValueChange={(value) => setExportConfig(prev => ({ ...prev, format: value as ExportFormat }))}
                  >
                    <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="xlsx" id="xlsx" />
                      <Label htmlFor="xlsx" className="flex-1 cursor-pointer flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        <div>
                          <p className="font-medium">Excel (.xlsx)</p>
                          <p className="text-sm text-muted-foreground">Format Excel dengan multiple sheets</p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="csv" id="csv" />
                      <Label htmlFor="csv" className="flex-1 cursor-pointer flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        <div>
                          <p className="font-medium">CSV (.csv)</p>
                          <p className="text-sm text-muted-foreground">Format CSV untuk kompatibilitas luas</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pilih Kolom</CardTitle>
                  <CardDescription>Pilih kolom yang akan disertakan dalam export</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {EXPORT_FIELDS.map((field) => (
                        <div key={field.key} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                          <Checkbox
                            id={field.key}
                            checked={exportConfig.selectedFields.includes(field.key)}
                            onCheckedChange={() => toggleField(field.key)}
                          />
                          <Label htmlFor={field.key} className="flex-1 cursor-pointer">
                            {field.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExportConfig(prev => ({ ...prev, selectedFields: EXPORT_FIELDS.map(f => f.key) }))}
                    >
                      Pilih Semua
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExportConfig(prev => ({ ...prev, selectedFields: [] }))}
                    >
                      Hapus Semua
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Opsi Tambahan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeHeader"
                      checked={exportConfig.includeHeader}
                      onCheckedChange={(checked) => setExportConfig(prev => ({ ...prev, includeHeader: checked as boolean }))}
                    />
                    <Label htmlFor="includeHeader" className="cursor-pointer">
                      Sertakan header kolom
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Preview Data */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preview Data</CardTitle>
                  <CardDescription>
                    Preview {previewData.length} baris pertama dari data yang akan diexport
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <ScrollArea className="w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {exportConfig.selectedFields.map((fieldKey) => {
                              const field = EXPORT_FIELDS.find(f => f.key === fieldKey)
                              return (
                                <TableHead key={fieldKey}>{field?.label || fieldKey}</TableHead>
                              )
                            })}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewData.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={exportConfig.selectedFields.length} className="text-center py-8">
                                Tidak ada data untuk ditampilkan
                              </TableCell>
                            </TableRow>
                          ) : (
                            previewData.map((row, idx) => (
                              <TableRow key={idx}>
                                {exportConfig.selectedFields.map((fieldKey) => (
                                  <TableCell key={fieldKey}>
                                    {row[fieldKey] ?? "-"}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Process Export */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  {exporting ? (
                    <>
                      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                      <p className="text-lg font-medium">Sedang memproses export...</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Mohon tunggu, jangan tutup halaman ini
                      </p>
                    </>
                  ) : exportResult ? (
                    <>
                      {exportResult.success ? (
                        <>
                          <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                          <p className="text-lg font-medium">Export berhasil!</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            {exportResult.exportedCount?.toLocaleString()} data berhasil diexport
                          </p>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                          <p className="text-lg font-medium">Export gagal</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            {exportResult.message}
                          </p>
                        </>
                      )}
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 5: Result */}
          {currentStep === 5 && exportResult && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {exportResult.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    {exportResult.success ? "Export Berhasil" : "Export Gagal"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {exportResult.success ? (
                    <>
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <p className="font-medium">File berhasil dibuat!</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          File: <strong>{exportResult.fileName}</strong>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total data: <strong>{exportResult.exportedCount?.toLocaleString()}</strong> member
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => router.push("/members")}>
                          Kembali ke Member
                        </Button>
                        <Button variant="outline" onClick={() => setCurrentStep(1)}>
                          Export Lagi
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {exportResult.message || "Terjadi kesalahan saat melakukan export"}
                        </AlertDescription>
                      </Alert>
                      <div className="flex gap-2">
                        <Button onClick={() => router.push("/members")}>
                          Kembali ke Member
                        </Button>
                        <Button variant="outline" onClick={() => setCurrentStep(1)}>
                          Coba Lagi
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </Wizard>
      </div>
    </div>
  )
}

