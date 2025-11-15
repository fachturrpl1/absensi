import { useQuery } from "@tanstack/react-query"
import { IPositions } from "@/interface"
import { useOrganizationId } from "./use-organization-id"

import { logger } from '@/lib/logger';
// Custom hook untuk fetch positions dengan caching via API route (GET)
export function usePositions() {
  const { data: organizationId } = useOrganizationId()
  
  return useQuery({
    queryKey: ["positions", organizationId], // Include organizationId untuk isolasi cache
    queryFn: async () => {
      logger.debug('[React Query] Fetching positions via API for org:', organizationId)
      const response = await fetch('/api/positions', { credentials: 'same-origin' })
      const json = await response.json()
      if (!json.success) {
        throw new Error(json.message || 'Failed to fetch positions')
      }
      return json.data as IPositions[]
    },
    enabled: !!organizationId, // Only run when organizationId exists
    staleTime: 5 * 60 * 1000, // 5 menit - positions jarang berubah
    gcTime: 15 * 60 * 1000, // Cache 15 menit
  })
}
