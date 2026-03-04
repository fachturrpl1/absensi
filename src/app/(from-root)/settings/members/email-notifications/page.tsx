"use client"

import { useState } from "react"

import { Lock, Info } from "lucide-react"
import { MembersSidebar } from "@/components/settings/MembersSidebar"
import { MembersHeader } from "@/components/settings/MembersHeader"
import { Button } from "@/components/ui/button"

export default function EmailNotificationsPage() {
  const [defaultEmailNotifications, setDefaultEmailNotifications] = useState(false)

  return (
    <div className="flex flex-col min-h-screen bg-white w-full">
      <MembersHeader activeTab="custom-fields" />

      {/* Main Content */}
      <div className="flex flex-1 w-full">
        {/* Left Sidebar */}
        <MembersSidebar activeItem="email-notifications" />

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {/* Email Notifications Section */}
          <div className="space-y-6">
            {/* Feature Upgrade Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-slate-600" />
                <p className="text-sm text-slate-900">
                  This feature can be purchased by upgrading to the Enterprise plan.
                </p>
              </div>
              <Button
                variant="default"
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                View plans & add-ons
              </Button>
            </div>

            {/* Email Notifications Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">EMAIL NOTIFICATIONS</h2>
              </div>
              <div className="space-y-3 text-sm text-slate-600">
                <p>
                  When creating new accounts, this sets whether the members will receive ANY email communication from Hubstaff. This includes notifications about their own work as well as anyone they might manage.
                </p>
                <p>
                  This setting can be altered when creating the accounts or individually overridden afterwards in the table below.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">DEFAULT:</span>
                    <Info className="h-4 w-4 text-slate-400" />
                  </div>
                  {/* Toggle Switch with Off/On labels */}
                  <div className="flex items-center gap-1 rounded-full border border-slate-300 bg-slate-200 p-1">
                    <button
                      onClick={() => setDefaultEmailNotifications(false)}
                      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${!defaultEmailNotifications
                        ? "bg-white text-slate-900 shadow-sm"
                        : "bg-transparent text-slate-600"
                        }`}
                    >
                      Off
                    </button>
                    <button
                      onClick={() => setDefaultEmailNotifications(true)}
                      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${defaultEmailNotifications
                        ? "bg-white text-slate-900 shadow-sm"
                        : "bg-transparent text-slate-600"
                        }`}
                    >
                      On
                    </button>
                  </div>
                  <span className="text-sm text-slate-600">
                    Allow members to receive Hubstaff emails
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

