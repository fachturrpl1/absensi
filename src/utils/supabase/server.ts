import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { logger } from '@/lib/logger';
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Add error handling for malformed cookies
              try {
                cookieStore.set(name, value, options)
              } catch (error) {
                logger.warn(`Failed to set cookie ${name}:`, error)
              }
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
