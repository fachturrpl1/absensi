"use client"

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

/**
 * Client-side layout wrapper to disable aggressive prefetching
 * Reduces initial page load requests
 */
export function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Disable automatic prefetching for navigation
    // Only prefetch when user hovers/clicks
    const links = document.querySelectorAll('a[href^="/"]')
    
    links.forEach((link) => {
      const href = link.getAttribute('href')
      if (!href) return
      
      // Remove Next.js automatic prefetch behavior
      link.removeAttribute('data-prefetch')
      
      // Add manual prefetch on hover
      let prefetchTimeout: NodeJS.Timeout
      
      const handleMouseEnter = () => {
        prefetchTimeout = setTimeout(() => {
          router.prefetch(href)
        }, 100) // Debounce 100ms
      }
      
      const handleMouseLeave = () => {
        clearTimeout(prefetchTimeout)
      }
      
      link.addEventListener('mouseenter', handleMouseEnter)
      link.addEventListener('mouseleave', handleMouseLeave)
      
      return () => {
        link.removeEventListener('mouseenter', handleMouseEnter)
        link.removeEventListener('mouseleave', handleMouseLeave)
      }
    })
  }, [pathname, router])

  return <>{children}</>
}
