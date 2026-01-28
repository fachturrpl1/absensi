"use client"

import { useState } from "react"
import Link from "next/link"
import { Users, Lock, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function EmailNotificationsPage() {
  const [defaultEmailNotifications, setDefaultEmailNotifications] = useState(false)

  return (
    <div className="flex flex-col min-h-screen bg-white w-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 w-full">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-slate-700" />
          <h1 className="text-2xl font-semibold text-slate-900">Members</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-slate-200 w-full">
        <div className="flex gap-8">
          <Link
            href="/settings/members/custom-fields"
            className="px-4 py-3 text-sm font-medium text-slate-900 border-b-2 border-slate-900 transition-colors"
          >
            CUSTOM FIELDS
          </Link>
          <Link
            href="#"
            className="px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 border-b-2 border-transparent hover:border-slate-300 transition-colors"
          >
            WORK TIME LIMITS
          </Link>
          <Link
            href="#"
            className="px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 border-b-2 border-transparent hover:border-slate-300 transition-colors"
          >
            PAYMENTS
          </Link>
          <Link
            href="#"
            className="px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 border-b-2 border-transparent hover:border-slate-300 transition-colors"
          >
            ACHIEVEMENTS
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 w-full">
        {/* Left Sidebar */}
        <div className="w-64 border-r border-slate-200 bg-slate-50">
          <div className="p-4 space-y-1">
            <Link
              href="/settings/members/custom-fields"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              Profile fields
            </Link>
            <Link
              href="/settings/members/email-notifications"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-900 bg-slate-100 rounded-md border-l-4 border-slate-900"
            >
              Email notifications
            </Link>
          </div>
        </div>

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
                      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                        !defaultEmailNotifications
                          ? "bg-white text-slate-900 shadow-sm"
                          : "bg-transparent text-slate-600"
                      }`}
                    >
                      Off
                    </button>
                    <button
                      onClick={() => setDefaultEmailNotifications(true)}
                      className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                        defaultEmailNotifications
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

