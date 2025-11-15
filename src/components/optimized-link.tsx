"use client"

import Link, { LinkProps } from 'next/link'
import { useState } from 'react'

/**
 * Optimized Link component that only prefetches on hover
 * Reduces initial page load by not prefetching all links immediately
 */
export function HoverPrefetchLink({
  href,
  children,
  className,
  ...props
}: LinkProps & { 
  children: React.ReactNode
  className?: string
}) {
  const [active, setActive] = useState(false)

  return (
    <Link
      href={href}
      prefetch={active ? null : false}
      onMouseEnter={() => setActive(true)}
      className={className}
      {...props}
    >
      {children}
    </Link>
  )
}

/**
 * Link component that never prefetches
 * Use for footer links or less critical navigation
 */
export function NoPrefetchLink({
  children,
  className,
  ...props
}: LinkProps & { 
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link {...props} prefetch={false} className={className}>
      {children}
    </Link>
  )
}
