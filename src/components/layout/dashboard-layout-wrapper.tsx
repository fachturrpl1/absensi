'use client';

import { usePathname } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebarNew } from '@/components/layout-new/app-sidebar-new';
import { NavbarNew } from '@/components/layout-new/navbar-new';

export function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Pages that should NOT have sidebar/navbar
  const publicPaths = [
    '/auth/login',
    '/auth/signup',
    '/auth/callback',
    '/auth/reset-password',
    '/auth/forgot-password',
    '/onboarding',
    '/accept-invite',
    '/invite',
    '/account-inactive',
    '/organization-inactive',
    '/subscription-expired',
  ];

  // Check if current path is public (no sidebar/navbar)
  const isPublicPath = publicPaths.some(path => pathname?.startsWith(path));

  // If public path, render children without layout
  if (isPublicPath) {
    return <>{children}</>;
  }

  // Dashboard pages: render with sidebar/navbar
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebarNew />
      <SidebarInset>
        <NavbarNew />
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
