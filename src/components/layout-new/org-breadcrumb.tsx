'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useOrgStore } from '@/store/org-store'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

export function OrgBreadcrumb() {
  const pathname = usePathname()
  const { organizationName } = useOrgStore()
  const [isHydrated, setIsHydrated] = useState(false)
  const [displayName, setDisplayName] = useState<string | null>(null)

  useEffect(() => {
    // Set hydrated flag
    setIsHydrated(true)
    
    // Try to get organizationName from localStorage as fallback
    // This handles the case where Zustand hasn't hydrated yet
    if (!organizationName) {
      try {
        const storedState = localStorage.getItem('org-store')
        if (storedState) {
          const parsed = JSON.parse(storedState)
          if (parsed.state?.organizationName) {
            setDisplayName(parsed.state.organizationName)
          }
        }
      } catch (error) {
        console.error('Error reading from localStorage:', error)
      }
    }
  }, [])

  // Update displayName when organizationName changes (after Zustand hydration)
  useEffect(() => {
    if (organizationName) {
      setDisplayName(organizationName)
    }
  }, [organizationName])

  // Mapping pathname ke breadcrumb labels
  const pathMapping: Record<string, string> = {
    // Attendance
    '/attendance': 'Attendance',
    '/attendance/list': 'List',
    '/attendance/add': 'Add',
    '/attendance/locations': 'Locations',
    '/attendance-devices': 'Devices',
    '/analytics': 'Analytics',

    // Schedules
    '/schedule': 'Schedules',
    '/member-schedules': 'Member Schedules',

    // Leaves
    '/leaves': 'Leaves',
    '/leaves/new': 'New',
    '/leaves/types': 'Types',

    // Organization
    '/members': 'Members',
    '/group': 'Groups',
    '/position': 'Positions',
    '/organization': 'Organization',
    '/organization/new': 'New',
    '/organization/settings': 'Settings',
    '/organization/finger': 'Fingerprint',

    // Fingerprint
    '/finger': 'Fingerprint',

    // Home
    '/': 'Home',
  }

  // Parent mapping untuk nested pages
  const parentMapping: Record<string, string> = {
    '/attendance/list': '/attendance',
    '/attendance/add': '/attendance',
    '/attendance/locations': '/attendance',
    '/attendance-devices': '/attendance',
    '/analytics': '/attendance',
    '/member-schedules': '/schedule',
    '/leaves/new': '/leaves',
    '/leaves/types': '/leaves',
  }

  const buildBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = []
    
    // Use displayName (which has fallback to localStorage) instead of organizationName
    const nameToDisplay = displayName || organizationName

    // Jika di halaman /organization, hanya tampilkan organization name
    if (pathname === '/organization') {
      if (nameToDisplay) {
        items.push({
          label: nameToDisplay,
          href: '/organization',
        })
      }
      return items
    }

    // Untuk halaman lain, tambah organization name jika ada
    if (nameToDisplay) {
      items.push({
        label: nameToDisplay,
        href: '/organization',
      })
    }

    // Cek apakah ada parent page (skip untuk /organization/* pages)
    if (!pathname.startsWith('/organization/')) {
      const parentPath = parentMapping[pathname]
      if (parentPath) {
        const parentLabel = pathMapping[parentPath]
        if (parentLabel) {
          items.push({
            label: parentLabel,
            href: parentPath,
          })
        }
      }
    }

    // Tambah current page berdasarkan pathname
    const currentLabel = pathMapping[pathname]
    if (currentLabel && currentLabel !== nameToDisplay) {
      items.push({
        label: currentLabel,
        href: pathname,
      })
    }

    return items
  }

  const breadcrumbs = buildBreadcrumbs()

  // Jika tidak ada breadcrumb, jangan render
  if (breadcrumbs.length === 0) {
    return null
  }

  // Jangan render sampai client-side hydration selesai
  // Tapi jika ada displayName dari localStorage, boleh render
  if (!isHydrated && !displayName) {
    return null
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground" suppressHydrationWarning>
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center gap-2" suppressHydrationWarning>
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              {item.label}
            </Link>
          ) : (
            <span
              className={`${
                index === breadcrumbs.length - 1 ? 'text-foreground font-medium' : ''
              }`}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
