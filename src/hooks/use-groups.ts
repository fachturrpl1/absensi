import { useQuery } from "@tanstack/react-query"
import { IDepartment } from "@/interface"

// Custom hook untuk fetch groups/departments dengan caching via API route (GET)
export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      console.log('[React Query] Fetching groups via API')
      const response = await fetch('/api/groups', { credentials: 'same-origin' })
      const json = await response.json()
      if (!json.success) {
        throw new Error(json.message || 'Failed to fetch groups')
      }
      return json.data as IDepartment[]
    },
    staleTime: 5 * 60 * 1000, // 5 menit - groups jarang berubah
    gcTime: 15 * 60 * 1000, // Cache 15 menit
  })
}
