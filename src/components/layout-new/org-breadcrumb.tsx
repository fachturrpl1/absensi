'use client'

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
    '/organization/new': '/organization',
    '/organization/settings': '/organization',
  }

  const buildBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = []

    // Tambah organization name jika ada
    if (organizationName) {
      items.push({
        label: organizationName,
        href: '/organization',
      })
    }

    // Cek apakah ada parent page
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

    // Tambah current page berdasarkan pathname (skip jika di halaman /organization)
    if (pathname !== '/organization') {
      const currentLabel = pathMapping[pathname]
      if (currentLabel && currentLabel !== organizationName) {
        items.push({
          label: currentLabel,
          href: pathname,
        })
      }
    }

    return items
  }

  const breadcrumbs = buildBreadcrumbs()

  // Jika tidak ada breadcrumb, jangan render
  if (breadcrumbs.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
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
