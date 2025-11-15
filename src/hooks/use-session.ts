import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'

/**
 * Centralized session hook - single source of truth for current user
 * All other hooks should use this instead of calling auth.getUser() directly
 */
export function useSession() {
  return useQuery({
    queryKey: ['session', 'user'],
    queryFn: async (): Promise<User | null> => {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        throw error
      }
      
      return user
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: false,
    refetchOnWindowFocus: false,
  })
}
