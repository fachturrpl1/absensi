"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";

export default function AdminPanelLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Public pages: no layout
  const publicPages = ["/auth/login", "/auth/signup", "/onboarding"];
  const isPublicPage = publicPages.some(page => pathname === page) || pathname?.startsWith("/invite");
  
  if (isPublicPage) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
