"use client"

import React from 'react'
import Link from 'next/link'

export default function AcceptInvitePage() {
  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-semibold mb-4">Invite Acceptance Disabled</h1>
        <p className="mb-4 text-muted-foreground">
          The invite acceptance flow is temporarily disabled by the administrator. If you received an invite,
          please contact your organization administrator for assistance. You can still log in if you already have an account.
        </p>
        <div className="flex gap-2">
          <Link href="/auth/login" className="btn btn-primary">Go to Login</Link>
          <Link href="/support" className="btn btn-secondary">Contact Support</Link>
        </div>
      </div>
    </div>
  )
}
