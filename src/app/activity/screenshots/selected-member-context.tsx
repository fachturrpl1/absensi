"use client"

import { createContext, ReactNode, useContext } from "react"
import type { Member } from "@/lib/data/dummy-data"

export interface SelectedMemberContextValue {
  selectedMemberId: string | null
  selectedMember: Member | null
  selectedDate: Date
}

const SelectedMemberContext = createContext<SelectedMemberContextValue | undefined>(undefined)

export function useSelectedMemberContext() {
  const context = useContext(SelectedMemberContext)
  if (!context) {
    throw new Error("SelectedMemberContext must be used within its provider")
  }
  return context
}

export function SelectedMemberProvider({
  value,
  children,
}: {
  value: SelectedMemberContextValue
  children: ReactNode
}) {
  return (
    <SelectedMemberContext.Provider value={value}>
      {children}
    </SelectedMemberContext.Provider>
  )
}

