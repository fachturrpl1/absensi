import { useQuery } from "@tanstack/react-query"
import { IPositions } from "@/interface"

import { logger } from '@/lib/logger';
// Custom hook untuk fetch positions dengan caching via API route (GET)
export function usePositions() {
  return useQuery({
    queryKey: ["positions"],
    queryFn: async () => {
      logger.debug('[React Query] Fetching positions via API')
      const response = await fetch('/api/positions', { credentials: 'same-origin' })
      const json = await response.json()
      if (!json.success) {
        throw new Error(json.message || 'Failed to fetch positions')
      }
      return json.data as IPositions[]
    },
    staleTime: 5 * 60 * 1000, // 5 menit - positions jarang berubah
    gcTime: 15 * 60 * 1000, // Cache 15 menit
  })
}
