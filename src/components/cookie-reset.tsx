"use client"

import { Button } from "@/components/ui/button"
import { clearSupabaseCookies, checkAndClearMalformedCookies } from "@/utils/cookie-helper"
import { useEffect } from "react"

/**
 * Emergency cookie reset component
 * Place this temporarily in your layout or create a dedicated page for it
 */
export function CookieReset() {
  useEffect(() => {
    // Automatically check and clear malformed cookies on mount
    checkAndClearMalformedCookies()
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        onClick={clearSupabaseCookies}
        variant="destructive"
        size="sm"
      >
        Clear Auth Cookies
      </Button>
    </div>
  )
}