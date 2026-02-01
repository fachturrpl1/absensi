"use client"

import { PoliciesHeader } from "@/components/settings/PoliciesHeader"
import { WorkBreaksSidebar } from "@/components/settings/WorkBreaksSidebar"

export default function WorkBreakNotificationsPage() {
    return (
        <div className="flex flex-col min-h-screen bg-white">
            <PoliciesHeader activeTab="work-breaks" />
            <div className="flex flex-1">
                <WorkBreaksSidebar activeItem="notifications" />
                <div className="flex-1 p-8">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Work Break Notifications</h2>
                    <p className="text-slate-500">Notification settings will go here.</p>
                </div>
            </div>
        </div>
    )
}
