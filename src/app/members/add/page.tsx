"use client"

import React from "react"
import { ContentLayout } from "@/components/admin-panel/content-layout"

export default function AddOrganizationPageDisabled() {
    return (
        <ContentLayout title="Add Member (Disabled)">
            <div className="w-full max-w-6xl mx-auto p-8 text-center">
                <h2 className="text-lg font-semibold mb-2">Add Member feature is temporarily disabled</h2>
                <p className="text-sm text-muted-foreground">The ability to invite or create members has been turned off while we make changes. Please contact the administrator to add members manually.</p>
            </div>
        </ContentLayout>
    )
}