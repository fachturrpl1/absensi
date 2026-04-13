/**
 * use-org-date-format.ts
 *
 * Hook + utility untuk memformat tanggal menggunakan date_format
 * yang tersimpan di settings organisasi.
 *
 * Mendukung dua format input dari PostgreSQL:
 *   - "YYYY-MM-DD"              → kolom `date` (tanpa waktu)
 *   - "2024-01-15T07:00:00+07:00" → kolom `timestamptz`
 *
 * Solusi UTC-shift: string "YYYY-MM-DD" di-parse manual dengan dayjs
 * tanpa konversi timezone sehingga tanggal tidak bergeser sehari.
 */

import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"
import { useOrgStore } from "@/store/org-store"
import { DATE_FORMAT_VALUES, type DateFormatOption } from "@/lib/constants/date-formats"

dayjs.extend(customParseFormat)

// Fallback jika date_format di store belum terisi
const DEFAULT_FORMAT: DateFormatOption = "DD/MM/YYYY"

/**
 * Parse raw string dari PostgreSQL menjadi dayjs object.
 *
 * - "YYYY-MM-DD"    → parse dengan format eksplisit, tidak ada UTC shift
 * - ISO timestamp   → dayjs() biasa, offset sudah terbawa
 * - null/undefined  → return null
 */
export function parseOrgDate(raw: string | null | undefined): dayjs.Dayjs | null {
  if (!raw) return null

  // PostgreSQL `date` → "YYYY-MM-DD", parse eksplisit agar tidak kena UTC shift
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const parsed = dayjs(raw, "YYYY-MM-DD", true)
    return parsed.isValid() ? parsed : null
  }

  // PostgreSQL `timestamptz` → ISO string, dayjs handle offset otomatis
  const parsed = dayjs(raw)
  return parsed.isValid() ? parsed : null
}

/**
 * Format raw date string menggunakan format yang diberikan.
 * Return "-" jika nilai kosong atau tidak valid.
 */
export function formatDateWithFormat(
  raw: string | null | undefined,
  format: string
): string {
  const d = parseOrgDate(raw)
  if (!d) return "-"
  return d.format(format)
}

/**
 * Cek apakah tanggal masih di masa depan (belum dimulai).
 * Perbandingan di level hari — proyek yang mulai hari ini tidak dianggap locked.
 */
export function isDateInFuture(raw: string | null | undefined): boolean {
  const d = parseOrgDate(raw)
  if (!d) return false
  const today = dayjs().startOf("day")
  return d.isAfter(today)
}

/**
 * Hook — gunakan di komponen React.
 * Mengambil date_format dari org store dan mengembalikan fungsi formatDate.
 *
 * Contoh pemakaian:
 *   const { formatDate } = useOrgDateFormat()
 *   formatDate(project.startDate)  // → "15 Jan 2024" (sesuai settings org)
 */
export function useOrgDateFormat() {
  const dateFormat = useOrgStore(
    // Sesuaikan selector ini dengan nama field di store Anda
    // Jika store menyimpannya sebagai "date_format", ganti di sini
    (s) => (s as any).dateFormat ?? (s as any).date_format ?? DEFAULT_FORMAT
  )

  // Validasi — pastikan format yang tersimpan ada di daftar yang diizinkan
  const safeFormat: string = (DATE_FORMAT_VALUES as readonly string[]).includes(dateFormat)
    ? dateFormat
    : DEFAULT_FORMAT

  const formatDate = (raw: string | null | undefined): string =>
    formatDateWithFormat(raw, safeFormat)

  return { formatDate, dateFormat: safeFormat }
}