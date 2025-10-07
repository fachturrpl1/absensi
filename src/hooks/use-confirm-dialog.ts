"use client"

import { useState } from 'react'

export function useConfirmDialog() {
  const [open, setOpen] = useState(false)
  const [callback, setCallback] = useState<(() => void) | null>(null)

  const onConfirm = (callback: () => void) => {
    setCallback(() => callback)
    setOpen(true)
  }

  const handleConfirm = () => {
    if (callback) callback()
    setOpen(false)
    setCallback(null)
  }

  return {
    open,
    setOpen,
    onConfirm,
    handleConfirm
  }
}