'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Combined paths - paths yang tidak perlu dipisah
const combinedPaths: Record<string, string> = {
  '/organization/settings': 'Organization Settings',
  '/settings/invitations': 'Settings Invitations',
};

// Path mapping untuk breadcrumb labels
const pathMapping: Record<string, string> = {
  'members': 'Members',
  'attendance': 'Attendance',
  'schedule': 'Schedules',
  'member-schedules': 'Member Schedules',
  'leaves': 'Leaves',
  'group': 'Groups',
  'department': 'Groups',
  'position': 'Positions',
  'role': 'Roles',
  'permission': 'Permissions',
  'analytics': 'Analytics',
  'organization': 'Organization',
  'settings': 'Settings',
  'account': 'Account',
  'users': 'Users',
  'locations': 'Locations',
  'add': 'Add',
  'new': 'New',
  'edit': 'Edit',
  'types': 'Types',
  'invitations': 'Invitations',
  'check-in': 'Check In',
  'accept-invite': 'Accept Invitation',
  'detail': 'Detail',
};

// Function to check if segment is an ID (UUID or numeric)
function isId(segment: string): boolean {
  return /^\d+$/.test(segment) || /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(segment);
}

interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrentPage: boolean;
}

export function DynamicBreadcrumb() {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const breadcrumbs = React.useMemo((): BreadcrumbItem[] => {
    const paths = pathname.split('/').filter(Boolean);
    
    if (paths.length === 0) {
      return [{ label: 'Home', href: '/', isCurrentPage: true }];
    }

    // Check if current path is a combined path
    if (combinedPaths[pathname]) {
      return [
        { label: 'Home', href: '/', isCurrentPage: false },
        { label: combinedPaths[pathname], href: pathname, isCurrentPage: true },
      ];
    }

    const items: BreadcrumbItem[] = [{ label: 'Home', href: '/', isCurrentPage: false }];
    let currentPath = '';
    const pathsToSkip = new Set<number>();

    // Check for combined paths in the middle
    paths.forEach((segment, index) => {
      if (pathsToSkip.has(index)) return;

      // Check if this and next segment form a combined path
      if (index < paths.length - 1) {
        const combinedPath = `/${segment}/${paths[index + 1]}`;
        if (combinedPaths[combinedPath]) {
          pathsToSkip.add(index + 1); // Skip next segment
          const isLast = index === paths.length - 2 || (index === paths.length - 3 && isId(paths[paths.length - 1]));
          items.push({
            label: combinedPaths[combinedPath],
            href: combinedPath,
            isCurrentPage: isLast,
          });
          currentPath = combinedPath;
          return;
        }
      }

      // Skip IDs
      if (isId(segment)) return;

      currentPath += `/${segment}`;
      const isLast = index === paths.length - 1;
      const label = pathMapping[segment] || segment.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');

      items.push({
        label,
        href: currentPath,
        isCurrentPage: isLast,
      });
    });

    return items;
  }, [pathname]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.href}>
            <BreadcrumbItem className={index === 0 ? "hidden md:block" : undefined}>
              {crumb.isCurrentPage ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && (
              <BreadcrumbSeparator className={index === 0 ? "hidden md:block" : undefined} />
            )}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
