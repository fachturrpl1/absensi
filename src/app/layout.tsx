import type { Metadata } from "next";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { UserProvider } from "@/components/user-provider";
import { TimezoneProvider } from "@/components/timezone-provider";
import { TimeFormatProvider } from "@/components/time-format-provider";
import { QueryProvider } from "@/providers/query-provider";
import OrganizationStatusChecker from "@/components/organization-status-checker";
import AccountStatusChecker from "@/components/account-status-checker";
import { PermissionInitializer } from "@/components/permission-initializer";
import { ToastProvider } from "@/components/notifications/toast-system";
import { DashboardLayoutWrapper } from "@/components/layout/dashboard-layout-wrapper";

import { createClient } from "@/utils/supabase/server";
import { 
  getCachedUserProfile, 
  getCachedOrganizationTimezone 
} from "@/lib/data-cache";

import { Geist, Geist_Mono } from "next/font/google";
import { InstallPrompt } from "@/components/install-prompt";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  fallback: ["system-ui", "arial"],
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Monaco",
    "Consolas",
    "Liberation Mono",
    "Courier New",
    "monospace",
  ],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SMKN 1 Muhammadiyah Nganjuk - Sistem Presensi",
  description:
    "Sistem Presensi Digital SMKN 1 Muhammadiyah Nganjuk untuk mengelola kehadiran siswa dan guru dengan mudah dan efisien.",
  metadataBase: new URL(
    process.env.APP_URL
      ? `${process.env.APP_URL}`
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:${process.env.PORT || 3000}`
  ),
  alternates: { canonical: "/" },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SMK Muh 1 Ngj",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    url: "/",
    title: "SMKN 1 Muhammadiyah Nganjuk",
    description: "Sistem Presensi Digital SMKN 1 Muhammadiyah Nganjuk",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SMKN 1 Muhammadiyah Nganjuk",
    description: "Sistem Presensi Digital SMKN 1 Muhammadiyah Nganjuk",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" }
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch Supabase user (server-side)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const metadata = user?.user_metadata || {};

  // Use cached profile fetch to avoid duplicates
  const profile = user ? await getCachedUserProfile(user.id) : null;

  const resolvedFirstName = profile?.first_name ?? metadata.first_name ?? undefined;
  const resolvedMiddleName = profile?.middle_name ?? metadata.middle_name ?? undefined;
  const resolvedLastName = profile?.last_name ?? metadata.last_name ?? undefined;

  const displayNameCandidates = [
    profile?.display_name,
    metadata.display_name,
    [resolvedFirstName, resolvedMiddleName, resolvedLastName].filter((part) => part && part.trim() !== "").join(" ") || null,
  ].filter((value): value is string => Boolean(value && value.trim() !== ""));

  const resolvedDisplayName = displayNameCandidates[0] ?? null;

  const mappedUser = user
    ? {
        id: user.id,
        email: user.email ?? undefined,
        employee_code: profile?.employee_code ?? undefined,
        first_name: resolvedFirstName ?? undefined,
        middle_name: resolvedMiddleName ?? undefined,
        last_name: resolvedLastName ?? undefined,
        display_name: resolvedDisplayName ?? undefined,
        profile_photo_url: profile?.profile_photo_url ?? metadata.profile_photo_url ?? undefined,
      }
    : null;

  // 🔹 Fetch timezone from the user's organization (cached)
  const timezone = user ? await getCachedOrganizationTimezone(user.id) : "UTC"

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512x512.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SMK Muh 1 Ngj" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <InstallPrompt />
        <UserProvider user={mappedUser} />
        {user && <PermissionInitializer userId={user.id} />}
        <TimezoneProvider timezone={timezone}>
          <QueryProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem={true}>
              <TimeFormatProvider>
                <ToastProvider>
                  <OrganizationStatusChecker>
                    <AccountStatusChecker>
                      <DashboardLayoutWrapper>
                        {children}
                      </DashboardLayoutWrapper>
                    </AccountStatusChecker>
                  </OrganizationStatusChecker>
                </ToastProvider>
              </TimeFormatProvider>
            </ThemeProvider>
          </QueryProvider>
          <Toaster />
        </TimezoneProvider>
      </body>
    </html>
  );
}
