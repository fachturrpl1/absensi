'use client';

import { usePathname } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebarNew } from './app-sidebar';
import { NavbarNew } from './navbar';

export function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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
    '/offline',
    '/role-selector',
  ];

  const hideNavbarPaths = [
    '/members/import-simple',
    '/members/import-simple-1',
    '/finger/import-simple',
    '/finger/import-simple/mapping',
  ];

  // Pages that need zero padding (full-bleed layouts)
  const noPaddingPaths = [
    '/activity/screenshots/setting',
    '/activity/tracking',
    '/activity/settings',
  ];

  const isPublicPath = publicPaths.some(path => pathname?.startsWith(path));
  const hideNavbar = hideNavbarPaths.some(path => pathname?.startsWith(path));
  const isNoPaddingPage = noPaddingPaths.some(path => pathname?.includes(path));

  if (isPublicPath) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebarNew />
      <SidebarInset className="flex flex-col min-w-0">
        {!hideNavbar && <NavbarNew />}
        <div className={`flex flex-1 flex-col w-full min-w-0 ${isNoPaddingPage ? '' : 'gap-4 p-4 md:gap-6 md:p-6'}`}>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}