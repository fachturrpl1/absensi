import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { useSession } from './use-session'

interface UserProfile {
  first_name?: string
  middle_name?: string
  last_name?: string
  display_name?: string
  profile_photo_url?: string
  employee_code?: string
}

/**
 * Centralized user profile hook
 * Fetches user profile data from user_profiles table
 */
export function useUserProfile() {
  const { data: user } = useSession()

  return useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user?.id) return null

      const supabase = createClient()

      const { data, error } = await supabase
        .from('user_profiles')
        .select('first_name, middle_name, last_name, display_name, profile_photo_url, employee_code')
        .eq('id', user.id)
        .maybeSingle()

      if (error) throw error

      return data
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}
