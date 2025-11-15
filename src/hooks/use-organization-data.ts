import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
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

      const supabase = createClient()

      // Single query to get all organization data
      const { data: member, error } = await supabase
        .from('organization_members')
        .select(`
          organization_id,
          is_active,
          organizations (
            name,
            time_format,
            timezone,
            is_active
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error
      if (!member || !member.organizations) return null

      const org = member.organizations as any

      // Normalize time format to include 'h' suffix
      const normalizeTimeFormat = (format: string | null | undefined): '12h' | '24h' => {
        if (!format) return '24h'
        if (format === '12' || format === '12h') return '12h'
        return '24h'
      }

      return {
        organizationId: member.organization_id,
        organizationName: org.name,
        timeFormat: normalizeTimeFormat(org.time_format),
        timezone: org.timezone || 'UTC',
        isActive: org.is_active,
        memberIsActive: member.is_active,
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 60, // 1 hour - organization data rarely changes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
