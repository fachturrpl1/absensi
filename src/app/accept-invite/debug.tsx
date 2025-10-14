"use client"

import React from 'react'

export default function AcceptInviteDebug() {
  const [text, setText] = React.useState('')
  React.useEffect(() => {
    setText(window.location.href)
  }, [])
  return (
    <div className="p-8">
      <h2 className="text-lg font-semibold mb-4">Accept-invite debug</h2>
      <p className="mb-2">Paste the invite link into your browser or click an invite email. This page will show the full URL.</p>
      <pre className="bg-gray-100 p-4 rounded">{text}</pre>
    </div>
  )
}
