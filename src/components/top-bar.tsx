"use client"

import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from "next/link"

export default function TopBar() {
  const pathname = usePathname()
  const paths = pathname.split("/").filter(Boolean)

  // fungsi bantu buat cek id
  const isId = (segment: string) => {
    return /^\d+$/.test(segment) || /^[0-9a-fA-F-]{36}$/.test(segment) // angka atau UUID
  }

  return (
    <div>
      <Breadcrumb>
        <BreadcrumbList>
          {paths.length === 0 ? (
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          ) : (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link href="/">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {paths.map((segment, index) => {
                // skip kalau ID
                if (isId(segment)) return null

                const href = "/" + paths.slice(0, index + 1).join("/")
                const isLast = index === paths.length - 1

                return (
                  <div key={href} className="flex items-center gap-2">
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage>
                          {segment.charAt(0).toUpperCase() + segment.slice(1)}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={href}>
                            {segment.charAt(0).toUpperCase() + segment.slice(1)}
                          </Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                )
              })}
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}
