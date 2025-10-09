import type { Metadata } from "next";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { UserProvider } from "@/components/user-provider";
import { TimezoneProvider } from "@/components/timezone-provider";
import { TimeFormatProvider } from "@/components/time-format-provider";
import AdminPanelLayout from "@/components/admin-panel/admin-panel-layout";

import { createClient } from "@/utils/supabase/server";
import { getOrganizationTimezoneByUserId } from "@/action/organization";

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
  // Ambil user Supabase (server-side)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const metadata = user?.user_metadata || {};

  const mappedUser = user
    ? {
        id: user.id,
        email: user.email ?? "",
        name:
          `${metadata.first_name || ""} ${metadata.last_name || ""}`.trim() ||
          user.email!,
        profile_photo_url: metadata.profile_photo_url ?? "",
      }
    : null;

  // 🔹 Ambil timezone dari organisasi user
  const timezone = user ? await getOrganizationTimezoneByUserId(user.id) : "UTC";

  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <UserProvider user={mappedUser} />
        <TimezoneProvider timezone={timezone}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <TimeFormatProvider>
              <AdminPanelLayout>{children}</AdminPanelLayout>
            </TimeFormatProvider>
          </ThemeProvider>
          <Toaster />
        </TimezoneProvider>
      </body>
    </html>
  );
}
