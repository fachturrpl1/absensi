"use client"

import { useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useTimeFormat } from "@/store/time-format-store"

export function TimeFormatProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { setFormat } = useTimeFormat()
  const supabase = createClient()

  useEffect(() => {
    const fetchTimeFormat = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get user's organization
        const { data: orgMember } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", user.id)
          .single()

        if (!orgMember) return

        // Get organization settings
        const { data: org } = await supabase
          .from("organizations")
          .select("time_format")
          .eq("id", orgMember.organization_id)
          .single()

        if (org?.time_format) {
          setFormat(org.time_format)
        }
      } catch (error) {
        console.error("Error fetching time format:", error)
      }
    }

    fetchTimeFormat()
  }, [])

  return <>{children}</>
}