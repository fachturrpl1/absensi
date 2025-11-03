import { useQuery } from "@tanstack/react-query"
import { IOrganization_member } from "@/interface"

import { memberLogger } from '@/lib/logger';
// Custom hook untuk fetch members dengan caching via API route (GET)
export function useMembers() {
  return useQuery({
    queryKey: ["members"], // Key untuk caching
    queryFn: async () => {
      memberLogger.debug('[React Query] Fetching members via API')
      const response = await fetch('/api/members', { credentials: 'same-origin' })
      const json = await response.json()
      if (!json.success) {
        throw new Error(json.message || 'Failed to fetch members')
      }
      return json.data as IOrganization_member[]
    },
    staleTime: 3 * 60 * 1000, // Data fresh selama 3 menit
    gcTime: 10 * 60 * 1000, // Cache disimpan 10 menit
  })
}

// Hook dengan filter organization
export function useMembersByOrganization(organizationId?: string) {
  return useQuery({
    queryKey: ["members", "organization", organizationId],
    queryFn: async () => {
      memberLogger.debug('[React Query] Fetching members by org via API')
      const response = await fetch('/api/members', { credentials: 'same-origin' })
      const json = await response.json()
      if (!json.success) {
        throw new Error(json.message || 'Failed to fetch members')
      }
      const data = json.data as IOrganization_member[]
      
      // Filter by organization if provided
      if (organizationId) {
        return data.filter(m => String(m.organization_id) === String(organizationId))
      }
      return data
    },
    enabled: !!organizationId, // Only run when organizationId exists
    staleTime: 3 * 60 * 1000,
  })
}
