import { useQuery } from "@tanstack/react-query"
import { IDepartments } from "@/interface"
import { useOrganizationId } from "./use-organization-id"

import { logger } from '@/lib/logger';
// Custom hook untuk fetch groups/departments dengan caching via API route (GET)
export function useGroups() {
  const { data: organizationId } = useOrganizationId()
  
  return useQuery({
    queryKey: ["groups", organizationId], // Include organizationId untuk isolasi cache
    queryFn: async () => {
      logger.debug('[React Query] Fetching groups via API for org:', organizationId)
      const response = await fetch('/api/groups', { credentials: 'same-origin' })
      const json = await response.json()
      if (!json.success) {
        throw new Error(json.message || 'Failed to fetch groups')
      }
      return json.data as IDepartments[]
    },
    enabled: !!organizationId, // Only run when organizationId exists
    staleTime: 5 * 60 * 1000, // 5 menit - groups jarang berubah
    gcTime: 15 * 60 * 1000, // Cache 15 menit
  })
}
