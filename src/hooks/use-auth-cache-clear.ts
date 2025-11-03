import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/user-store'

import { authLogger } from '@/lib/logger';
/**
 * Hook to clear React Query cache when user changes
 * This prevents data leakage between different users/organizations
 */
export function useAuthCacheClear() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const previousUserId = useRef<string | null>(null)

  useEffect(() => {
    const currentUserId = user?.id ?? null

    // If user changed (login/logout/switch), clear all caches
    if (previousUserId.current !== null && previousUserId.current !== currentUserId) {
      authLogger.debug('[Auth Cache Clear] User changed, clearing React Query cache')
      queryClient.clear()
    }

    previousUserId.current = currentUserId
  }, [user?.id, queryClient])
}
