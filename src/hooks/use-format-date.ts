import { useQuery } from "@tanstack/react-query"
import { formatLocalTime } from "@/utils/timezone"
import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useOrgStore } from "@/store/org-store"

export function useFormatDate() {
  const [mounted, setMounted] = useState(false)
  
  // Ambil ID organisasi yang sedang aktif saat ini
  const { organizationId } = useOrgStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: timezone } = useQuery({
    queryKey: ["org-timezone", organizationId],
    queryFn: async () => {
      if (!organizationId) return "UTC"
      
      const supabase = createClient()
      const { data, error } = await supabase
        .from("organizations")
        .select("timezone")
        .eq("id", organizationId)
        .single() // Aman menggunakan single karena ID Organisasi bersifat unik

      if (error || !data?.timezone) {
        console.error("Gagal menarik zona waktu:", error)
        return "UTC"
      }
      
      return data.timezone
    },
    // Hanya jalankan query jika organizationId sudah tersedia
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5
  })

  // Pastikan fallback aman jika masih loading
  const finalTimezone = timezone || "UTC"
  const timeFormat = "24h"

  const formatDate = (utcString: string | null | undefined, includeDate: boolean = true) => {
    if (!mounted) return "-"
    return formatLocalTime(utcString, finalTimezone, timeFormat, includeDate)
  }

  return { formatDate, timezone: finalTimezone, isLoaded: mounted }
}