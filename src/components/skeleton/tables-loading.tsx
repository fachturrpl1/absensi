import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table"
import { Loader2 } from "lucide-react"

// ─── TableSkeleton ────────────────────────────────────────────────────────────
//
// Generic skeleton untuk tabel. Dikonfigurasi lewat prop `columns`.
//
// Contoh penggunaan:
//
//   // Default generic (hanya kotak-kotak):
//   <TableSkeleton rows={8} columns={5} />
//
//   // Members table (avatar + nama + badge + status):
//   <TableSkeleton rows={8} columns={membersColumns} />
//
//   // Projects table (checkbox + nama + badge + actions):
//   <TableSkeleton rows={6} columns={projectsColumns} />
//
// ─────────────────────────────────────────────────────────────────────────────

export type ColumnSkeletonDef = {
  /** Lebar header (Tailwind class, e.g. "w-20") */
  headerWidth?: string
  /** Tinggi skeleton header (default "h-3.5") */
  headerHeight?: string
  /** Konten cell: preset atau custom render */
  cell?:
    | "avatar"       // bulat h-8 w-8
    | "name"         // bar panjang, simulasi nama
    | "badge"        // rounded-md pendek
    | "status"       // dot + bar
    | "actions"      // dua tombol outline
    | "checkbox"     // kotak kecil
    | "text"         // bar generik (default)
    | "number"       // bar pendek tabular
  /** Lebar custom untuk cell skeleton (Tailwind class) */
  cellWidth?: string
  /** className tambahan untuk TableHead */
  headClassName?: string
  /** className tambahan untuk TableCell */
  cellClassName?: string
  /** Sembunyikan di mobile (hidden md:table-cell) */
  hiddenMobile?: boolean
}

interface TableSkeletonProps {
  rows?: number
  /**
   * Bisa berupa:
   * - number  → render N kolom generic (kotak-kotak biasa)
   * - ColumnSkeletonDef[]  → render kolom sesuai definisi
   */
  columns?: number | ColumnSkeletonDef[]
}

// ── Preset columns yang bisa di-import langsung ───────────────────────────────

/** Kolom untuk members table */
export const membersColumns: ColumnSkeletonDef[] = [
  { cell: "avatar",   headClassName: "w-10 px-4",                cellClassName: "px-4 py-3" },
  { cell: "name",     headerWidth: "w-20",                        cellClassName: "py-3" },
  { cell: "number",   headerWidth: "w-16",  cellWidth: "w-32" },
  { cell: "badge",    headerWidth: "w-14",  cellWidth: "w-20" },
  { cell: "text",     headerWidth: "w-12",  cellWidth: "w-14",  hiddenMobile: true },
  { cell: "text",     headerWidth: "w-14",  cellWidth: "w-16",  hiddenMobile: true },
  { cell: "status",   headerWidth: "w-16" },
  { cell: "actions",  headClassName: "w-20 text-right pr-6",     cellClassName: "px-4 pr-6 text-right" },
]

/** Kolom untuk projects table */
export const projectsColumns: ColumnSkeletonDef[] = [
  { cell: "checkbox", headClassName: "w-10" },
  { cell: "name",     headerWidth: "w-24" },
  { cell: "text",     headerWidth: "w-16",  cellWidth: "w-20" },
  { cell: "badge",    headerWidth: "w-12",  cellWidth: "w-24" },
  { cell: "text",     headerWidth: "w-16",  cellWidth: "w-24" },
  { cell: "number",   headerWidth: "w-10",  cellWidth: "w-8" },
  { cell: "actions",  headClassName: "w-16 text-right pr-4",     cellClassName: "pr-4 text-right" },
]

/** Kolom untuk groups table */
export const groupsColumns: ColumnSkeletonDef[] = [
  { cell: "text",     headerWidth: "w-16",  cellWidth: "w-14" },
  { cell: "name",     headerWidth: "w-24" },
  { cell: "text",     headerWidth: "w-32",  cellWidth: "w-48" },
  { cell: "badge",    headerWidth: "w-14",  cellWidth: "w-16" },
  { cell: "actions",  headClassName: "w-24 text-right pr-4",     cellClassName: "pr-4 text-right" },
]

/** Kolom untuk grouop/[id table]**/
export const groupMembersSkeletonColumns: ColumnSkeletonDef[] = [
  { cell: "avatar",  headClassName: "w-10 px-4",             cellClassName: "px-4 py-3" },
  { cell: "name",    headerWidth: "w-24",                     cellClassName: "py-3" },
  { cell: "number",  headerWidth: "w-16",  cellWidth: "w-32" },
  { cell: "text",    headerWidth: "w-12",  cellWidth: "w-14", hiddenMobile: true },
  { cell: "text",    headerWidth: "w-14",  cellWidth: "w-16", hiddenMobile: true },
  { cell: "status",  headerWidth: "w-16" },
]

/** Kolom untuk attendance list table */
export const attendanceListColumns: ColumnSkeletonDef[] = [
  { cell: "checkbox", headClassName: "w-10 px-3", cellClassName: "px-3 py-3" },
  { cell: "name", headerWidth: "w-20", cellClassName: "px-3 py-3", cellWidth: "w-32" },
  { cell: "text", headerWidth: "w-16", cellClassName: "px-3 py-3", cellWidth: "w-20" },
  { cell: "text", headerWidth: "w-16", cellClassName: "px-3 py-3", cellWidth: "w-20" },
  { cell: "text", headerWidth: "w-16", cellClassName: "px-3 py-3", cellWidth: "w-20" },
  { cell: "text", headerWidth: "w-16", cellClassName: "px-3 py-3", cellWidth: "w-20" },
  { cell: "text", headerWidth: "w-16", cellClassName: "px-3 py-3", cellWidth: "w-20" },
  { cell: "number", headerWidth: "w-20", cellClassName: "px-3 py-3", cellWidth: "w-12 text-center" },
  { cell: "badge", headerWidth: "w-16", cellClassName: "px-3 py-3", cellWidth: "w-20" },
  { cell: "actions", headClassName: "w-24 text-center px-3", cellClassName: "px-3 py-3 text-center" },
]

// ── Cell renderers ─────────────────────────────────────────────────────────────

function CellSkeleton({ type, cellWidth }: { type: ColumnSkeletonDef["cell"]; cellWidth?: string }) {
  switch (type) {
    case "avatar":
      return <div className="h-8 w-8 rounded-full bg-muted/80 animate-pulse" />

    case "name":
      return <div className={`h-4 ${cellWidth ?? "w-44"} rounded-full bg-muted animate-pulse`} />

    case "badge":
      return <div className={`h-6 ${cellWidth ?? "w-20"} rounded-md bg-muted/80 animate-pulse`} />

    case "status":
      return (
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-muted/80 animate-pulse" />
          <div className={`h-3.5 ${cellWidth ?? "w-14"} rounded bg-muted/90 animate-pulse`} />
        </div>
      )

    case "actions":
      return (
        <div className="flex justify-end gap-1">
          <div className="h-8 w-8 rounded bg-muted/70 animate-pulse" />
          <div className="h-8 w-8 rounded bg-muted/70 animate-pulse" />
        </div>
      )

    case "checkbox":
      return <div className="h-4 w-4 rounded bg-muted/80 animate-pulse" />

    case "number":
      return <div className={`h-3.5 ${cellWidth ?? "w-24"} rounded bg-muted/90 animate-pulse font-mono`} />

    case "text":
    default:
      return <div className={`h-3.5 ${cellWidth ?? "w-28"} rounded bg-muted/80 animate-pulse`} />
  }
}

// ── Main component ─────────────────────────────────────────────────────────────

export function TableSkeleton({ rows = 8, columns = 5 }: TableSkeletonProps) {
  // Normalise: angka → buat N kolom generic "text"
  const cols: ColumnSkeletonDef[] = typeof columns === "number"
    ? Array.from({ length: columns }, () => ({ cell: "text" as const }))
    : columns

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow className="border-b">
            {cols.map((col, i) => {
              const base = "font-semibold text-xs uppercase tracking-wide py-3"
              const hidden = col.hiddenMobile ? "hidden md:table-cell" : ""
              return (
                <TableHead key={i} className={[col.headClassName ?? base, hidden].filter(Boolean).join(" ")}>
                  {col.cell !== "avatar" && col.cell !== "checkbox" && col.cell !== "actions" && (
                    <div className={`${col.headerHeight ?? "h-3.5"} ${col.headerWidth ?? "w-16"} rounded bg-muted/80 animate-pulse`} />
                  )}
                  {col.cell === "actions" && (
                    <div className="flex gap-1 justify-end">
                      <div className="size-5 rounded bg-muted/60 animate-pulse" />
                      <div className="size-5 rounded bg-muted/60 animate-pulse" />
                    </div>
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>

        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex} className="transition-colors border-b last:border-0">
              {cols.map((col, colIndex) => {
                const hidden = col.hiddenMobile ? "hidden md:table-cell" : ""
                return (
                  <TableCell
                    key={colIndex}
                    className={[col.cellClassName ?? "py-3", hidden].filter(Boolean).join(" ")}
                  >
                    <CellSkeleton type={col.cell ?? "text"} cellWidth={col.cellWidth} />
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ─── Other skeletons (unchanged) ──────────────────────────────────────────────

export function CardSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <Skeleton className="h-7 w-[180px]" />
        <Skeleton className="h-5 w-[280px]" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      </CardContent>
    </Card>
  )
}

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-5 w-[120px]" />
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-11 w-[140px]" />
        <Skeleton className="h-11 w-[100px]" />
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <Skeleton className="h-5 w-[120px]" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-[80px] mb-2" />
              <Skeleton className="h-4 w-[140px]" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-7 w-[220px] mb-2" />
              <Skeleton className="h-4 w-[180px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[320px] w-full rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="space-y-3">
          <Skeleton className="h-7 w-[180px]" />
          <Skeleton className="h-4 w-[240px]" />
        </CardHeader>
        <CardContent>
          <TableSkeleton rows={5} columns={5} />
        </CardContent>
      </Card>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-5 w-[150px]" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 border rounded-md">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-3 w-[150px]" />
          </div>
          <Skeleton className="h-8 w-[80px]" />
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="w-full h-[300px] flex items-end gap-3 p-6 bg-muted/30 rounded-lg">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end">
          <Skeleton
            className="w-full rounded-t-lg"
            style={{ height: `${(i % 4 + 1) * 20}%` }}
          />
        </div>
      ))}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center gap-3">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
    </div>
  )
}