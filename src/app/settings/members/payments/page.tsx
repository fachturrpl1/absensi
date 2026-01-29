"use client"

import { useState } from "react"
import Link from "next/link"
import { Users, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function PaymentsPage() {
  const DEFAULT_PROCESS: "manually" | "automatically" = "manually"
  const DEFAULT_DELAY_DAYS = "0"
  const DEFAULT_PROOF_ENABLED = true

  const [processPayments, setProcessPayments] = useState<"manually" | "automatically">("manually")
  const [delayDays, setDelayDays] = useState("0")
  const [proofOfPaymentEnabled, setProofOfPaymentEnabled] = useState(true)

  const handleCancel = () => {
    setProcessPayments(DEFAULT_PROCESS)
    setDelayDays(DEFAULT_DELAY_DAYS)
    setProofOfPaymentEnabled(DEFAULT_PROOF_ENABLED)
  }

  const handleSave = () => {
    // TODO: connect to backend
    console.log("Save Payments Settings:", {
      processPayments,
      delayDays,
      proofOfPaymentEnabled,
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-white w-full relative">
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
            className="px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 border-b-2 border-transparent hover:border-slate-300 transition-colors"
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
            href="/settings/members/payments"
            className="px-4 py-3 text-sm font-medium text-slate-900 border-b-2 border-slate-900 transition-colors"
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
        <div className="w-64 border-r border-slate-200 bg-white">
          <div className="p-4 space-y-1">
            <Link
              href="/settings/members/custom-fields"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              Profile fields
            </Link>
            <Link
              href="/settings/members/email-notifications"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              Email notifications
            </Link>
            <Link
              href="/settings/members/payments"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-900 bg-slate-100 rounded-md border-l-4 border-slate-900"
            >
              Payments
            </Link>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          <div className="space-y-8 max-w-3xl">
            {/* Process Payments Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">Process Payments</h2>
                <Info className="h-4 w-4 text-slate-500" />
              </div>
              <p className="text-sm text-slate-600">
                Choose whether you want to manually send payments or have them automatically processed.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setProcessPayments("manually")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    processPayments === "manually"
                      ? "bg-slate-200 text-slate-900"
                      : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  Manually
                </button>
                <button
                  type="button"
                  onClick={() => setProcessPayments("automatically")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    processPayments === "automatically"
                      ? "bg-slate-200 text-slate-900"
                      : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  Automatically
                </button>
              </div>
            </div>

            {/* Delay payroll Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">Delay payroll</h2>
                <Info className="h-4 w-4 text-slate-500" />
              </div>
              <p className="text-sm text-slate-600">
                Set a payroll delay so that all payments can be made at one time
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="delay-days" className="text-sm font-medium text-slate-700">
                    SEND PAYMENTS AFTER
                  </Label>
                  <Info className="h-4 w-4 text-slate-500" />
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    id="delay-days"
                    type="number"
                    value={delayDays}
                    onChange={(e) => setDelayDays(e.target.value)}
                    className="w-24"
                    min="0"
                  />
                  <span className="text-sm text-slate-600">days</span>
                </div>
              </div>
            </div>

            {/* Proof of Payment PDF Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">Proof of Payment PDF</h2>
                <span className="px-2 py-0.5 text-xs font-semibold text-slate-700 bg-slate-200 rounded">
                  New
                </span>
                <Info className="h-4 w-4 text-slate-500" />
              </div>
              <p className="text-sm text-slate-600">
                Choose whether you want members paid through payroll integrations (Wise, PayPal or Payoneer) to receive emails with PDF attachments (amounts listed in organization currency).
              </p>
              
              {/* Toggle Switch */}
              <div className="flex items-center gap-2">
                <div className="relative inline-flex items-center bg-slate-200 border border-slate-300 rounded-full p-1">
                  <button
                    type="button"
                    onClick={() => setProofOfPaymentEnabled(false)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      !proofOfPaymentEnabled
                        ? "bg-white text-slate-900 shadow-sm"
                        : "bg-transparent text-slate-600"
                    }`}
                  >
                    Off
                  </button>
                  <button
                    type="button"
                    onClick={() => setProofOfPaymentEnabled(true)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      proofOfPaymentEnabled
                        ? "bg-white text-slate-900 shadow-sm"
                        : "bg-transparent text-slate-600"
                    }`}
                  >
                    On
                  </button>
                </div>
              </div>

              {/* Info Banner */}
              {proofOfPaymentEnabled && (
                <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-slate-600 mt-0.5 shrink-0" />
                    <div className="text-sm text-slate-700">
                      <p className="mb-2">Member and organization details will be included in the PDF attachment</p>
                      <ul className="list-disc list-inside space-y-1 text-slate-600">
                        <li>Update member details in their profile</li>
                        <li>Update organization details in organization settings</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="w-full sm:w-auto border-2 border-slate-900 bg-white text-slate-900 shadow-sm hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                className="w-full sm:w-auto bg-black hover:bg-slate-900 text-white shadow-sm"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

