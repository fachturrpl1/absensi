"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/store/user-store"
import { useOrgStore } from "@/store/org-store"
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
  const setOrganizationId = useOrgStore((state) => state.setOrganizationId)

  useEffect(() => {
    const loadPermissionsAndRole = async () => {
      try {
        // Load permissions
        const permissions = await getUserPermissions(userId)
        setPermissions(permissions)
        logger.debug("✅ Permissions loaded:", permissions)

        // Load organization role and organizationId
        const { role, organizationId } = await getUserOrgRole(userId)
        if (role?.code) {
          setRole(role.code)
          logger.debug("✅ Role loaded:", role.code)
        } else {
          setRole(null)
          logger.debug("⚠️ No organization role found")
        }

        // Set organizationId to store
        if (organizationId) {
          setOrganizationId(Number(organizationId), "")
          logger.debug("✅ Organization ID loaded:", organizationId)
        } else {
          // Cannot set null without name, skip
          logger.debug("⚠️ No organization ID found")
        }
      } catch (error) {
        logger.error("❌ Failed to load permissions and role:", error)
        setPermissions([])
        setRole(null)
        // Skip setOrganizationId on error
      }
    }

    if (userId) {
      loadPermissionsAndRole()
    }
  }, [userId, setPermissions, setRole, setOrganizationId])

  return null
}
