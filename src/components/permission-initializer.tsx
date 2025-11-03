"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/store/user-store"
import { getUserPermissions } from "@/lib/rbac"

import { logger } from '@/lib/logger';
/**
 * Permission Initializer Component
 * Loads user permissions on mount and stores them in Zustand
 * Should be placed in layout or root component
 */
export function PermissionInitializer({ userId }: { userId: string }) {
  const setPermissions = useAuthStore((state) => state.setPermissions)

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const permissions = await getUserPermissions(userId)
        setPermissions(permissions)
        logger.debug("✅ Permissions loaded:", permissions)
      } catch (error) {
        logger.error("❌ Failed to load permissions:", error)
        setPermissions([])
      }
    }

    if (userId) {
      loadPermissions()
    }
  }, [userId, setPermissions])

  return null
}
