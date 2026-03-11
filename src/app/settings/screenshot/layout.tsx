"use client"

import { BlurProvider } from "@/hooks/screenshot/use-blur-settings"

export default function ScreenshotLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <BlurProvider>
            {children}
        </BlurProvider>
    )
}
