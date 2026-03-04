"use client"

import { BlurProvider } from "./blur-context"

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
