import { createClient } from './supabase/client'

/**
 * Complete logout handler that clears all caches and state
 * Prevents data leakage between different user accounts
 */
export async function handleCompleteLogout() {
  try {
    // 1. Sign out from Supabase
    const supabase = createClient()
    await supabase.auth.signOut()

    // 2. Clear ALL localStorage (including React Query persist cache)
    localStorage.clear()

    // 3. Clear ALL sessionStorage
    sessionStorage.clear()

    // 4. Clear IndexedDB (if React Query persistence is enabled)
    if ('indexedDB' in window && indexedDB.databases) {
      try {
        const dbs = await indexedDB.databases()
        if (dbs) {
          dbs.forEach(db => {
            if (db.name) {
              indexedDB.deleteDatabase(db.name)
            }
          })
        }
      } catch (error) {
        console.warn('Failed to clear IndexedDB:', error)
      }
    }

    // 5. Clear all cookies (optional but recommended)
    if (typeof document !== 'undefined') {
      document.cookie.split(';').forEach(cookie => {
        const name = cookie.split('=')[0]?.trim()
        if (name) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        }
      })
    }

    // 6. Hard redirect to login (forces full page reload, clears React state)
    window.location.href = '/auth/login'
  } catch (error) {
    console.error('Logout error:', error)
    // Even if error, still redirect to login
    window.location.href = '/auth/login'
  }
}
