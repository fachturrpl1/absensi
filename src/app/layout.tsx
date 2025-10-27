import type { Metadata } from "next";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { UserProvider } from "@/components/user-provider";
import { TimezoneProvider } from "@/components/timezone-provider";
import { TimeFormatProvider } from "@/components/time-format-provider";
import { QueryProvider } from "@/providers/query-provider";
import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";

import { createClient } from "@/utils/supabase/server";
import { 
  getCachedUserProfile, 
  getCachedOrganizationTimezone 
} from "@/lib/data-cache";

import { Geist, Geist_Mono } from "next/font/google";

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
  title: "Attendance App",
  description:
    "A stunning and functional retractable sidebar for Next.js built on top of shadcn/ui complete with desktop and mobile responsiveness.",
  metadataBase: new URL(
    process.env.APP_URL
      ? `${process.env.APP_URL}`
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:${process.env.PORT || 3000}`
  ),
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "Attendance App",
    description: "A stunning and functional retractable sidebar for Next.js.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Attendance App",
    description: "A stunning and functional retractable sidebar for Next.js.",
  },
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
  const profile = user ? await getCachedUserProfile(user.id) : null

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <UserProvider user={mappedUser} />
        <TimezoneProvider timezone={timezone}>
          <QueryProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
              <TimeFormatProvider>
                <AdminPanelLayout>{children}</AdminPanelLayout>
              </TimeFormatProvider>
            </ThemeProvider>
          </QueryProvider>
          <Toaster />
        </TimezoneProvider>
      </body>
    </html>
  );
}
