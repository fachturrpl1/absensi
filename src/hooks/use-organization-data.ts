import { useQuery } from '@tanstack/react-query'
import { useSession } from './use-session'

interface OrganizationData {
  organizationId: number
  organizationName: string
  timeFormat: '12h' | '24h'
  timezone: string
  isActive: boolean
  memberIsActive: boolean
}

/**
 * Centralized organization data hook
 * Fetches all organization-related data in a single query
 */
export function useOrganizationData() {
  const { data: user } = useSession()

  return useQuery({
    queryKey: ['organization', 'full-data', user?.id],
    queryFn: async (): Promise<OrganizationData | null> => {
      if (!user?.id) return null

      // ✅ USE SECURE API ROUTE - hides database structure
      const response = await fetch('/api/organization/info', {
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 401) return null
        throw new Error('Failed to fetch organization data')
      }

      const { data } = await response.json()

      return {
        organizationId: data.id,
        organizationName: data.name,
        timeFormat: data.timeFormat,
        timezone: data.timezone,
        isActive: data.isActive,
        memberIsActive: data.memberIsActive,
      }
    },
    enabled: !!user?.id,
    staleTime: 0, // Always fetch fresh data to ensure immediate updates
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 1,
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true, // Refetch when component mounts (e.g., navigating to dashboard)
  })
}

/**
 * Hook to get only organization ID
 * Uses the shared organization data query
 */
export function useOrganizationId() {
  const { data, ...rest } = useOrganizationData()
  return {
    data: data?.organizationId ?? null,
    ...rest,
  }
}

/**
 * Hook to get only organization name
 * Uses the shared organization data query
 */
export function useOrganizationName() {
  const { data, isLoading, ...rest } = useOrganizationData()
  return {
    organizationName: data?.organizationName ?? null,
    loading: isLoading,
    ...rest,
  }
}

/**
 * Hook to get organization time format
 * Uses the shared organization data query
 */
export function useOrganizationTimeFormat() {
  const { data, ...rest } = useOrganizationData()
  return {
    timeFormat: data?.timeFormat ?? '24h',
    ...rest,
  }
}

/**
 * Hook to get organization timezone
 * Uses the shared organization data query
 */
export function useOrganizationTimezone() {
  const { data, ...rest } = useOrganizationData()
  return {
    timezone: data?.timezone ?? 'UTC',
    ...rest,
  }
}
