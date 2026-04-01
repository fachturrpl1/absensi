import { useQuery } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useOrgStore } from "@/store/org-store"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezonePlugin from "dayjs/plugin/timezone"

dayjs.extend(utc)
dayjs.extend(timezonePlugin)

export function useFormatDate() {
  const [mounted, setMounted] = useState(false)
  const { organizationId } = useOrgStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Mengambil 3 preferensi sekaligus dari database
  const { data: prefs, isLoading } = useQuery({
    queryKey: ["org-preferences", organizationId],
    queryFn: async () => {
      if (!organizationId) return null
      
      const supabase = createClient()
      const { data, error } = await supabase
        .from("organizations")
        .select("timezone, time_format, date_format")
        .eq("id", organizationId)
        .single()

      if (error) {
        console.error("Gagal menarik preferensi organisasi:", error)
        return null
      }
      
      return data
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5 // Cache 5 menit
  })

  // Nilai Fallback (Standar aman jika data kosong atau masih loading)
  const timezone = prefs?.timezone || "UTC"
  const timeFormat = prefs?.time_format || "24h"
  const dateFormat = prefs?.date_format || "DD/MM/YYYY"

  /**
   * 1. Fungsi untuk mencetak TANGGAL saja
   * Contoh output: 31/12/2026 atau 2026-12-31 (tergantung preferensi)
   */
  const formatOrgDate = (isoString: string | null | undefined) => {
    if (!mounted || !isoString) return "-"
    return dayjs.utc(isoString).tz(timezone).format(dateFormat)
  }

  /**
   * 2. Fungsi untuk mencetak JAM saja
   * Contoh output: 13:00 atau 01:00 PM (tergantung preferensi)
   */
  const formatOrgTime = (isoString: string | null | undefined) => {
    if (!mounted || !isoString) return "-"
    const timePattern = timeFormat === "12h" ? "hh:mm A" : "HH:mm"
    return dayjs.utc(isoString).tz(timezone).format(timePattern)
  }

  /**
   * 3. Fungsi untuk mencetak TANGGAL & JAM sekaligus
   * Contoh output: 31/12/2026, 13:00
   */
  const formatOrgDateTime = (isoString: string | null | undefined) => {
    if (!mounted || !isoString) return "-"
    const timePattern = timeFormat === "12h" ? "hh:mm A" : "HH:mm"
    return dayjs.utc(isoString).tz(timezone).format(`${dateFormat}, ${timePattern}`)
  }

  return {
    timezone,
    timeFormat,
    dateFormat,
    formatOrgDate,
    formatOrgTime,
    formatOrgDateTime,
    isLoaded: mounted && !isLoading
  }
}