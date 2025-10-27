import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'

export function useOrganizationId() {
  return useQuery({
    queryKey: ['organization', 'id'],
    queryFn: async () => {
      const supabase = createClient()
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Get organization from organization_members
      const { data: member, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (memberError) {
        throw new Error('Failed to fetch organization')
      }

      if (!member?.organization_id) {
        throw new Error('User not assigned to any organization')
      }

      return member.organization_id
    },
    staleTime: 1000 * 60 * 60, // 1 hour - organization rarely changes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}
