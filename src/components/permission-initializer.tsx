"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/store/user-store"
import { getUserPermissions, getUserOrgRole } from "@/lib/rbac"

import { logger } from '@/lib/logger';
/**
 * Permission Initializer Component
 * Loads user permissions and role on mount and stores them in Zustand
 * Should be placed in layout or root component
 */
export function PermissionInitializer({ userId }: { userId: string }) {
  const setPermissions = useAuthStore((state) => state.setPermissions)
  const setRole = useAuthStore((state) => state.setRole)

  useEffect(() => {
    const loadPermissionsAndRole = async () => {
      try {
        // Load permissions
        const permissions = await getUserPermissions(userId)
        setPermissions(permissions)
        logger.debug("✅ Permissions loaded:", permissions)

        // Load organization role
        const { role } = await getUserOrgRole(userId)
        if (role?.code) {
          setRole(role.code)
          logger.debug("✅ Role loaded:", role.code)
        } else {
          setRole(null)
          logger.debug("⚠️ No organization role found")
        }
      } catch (error) {
        logger.error("❌ Failed to load permissions and role:", error)
        setPermissions([])
        setRole(null)
      }
    }

    if (userId) {
      loadPermissionsAndRole()
    }
  }, [userId, setPermissions, setRole])

  return null
}
