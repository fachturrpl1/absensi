"use client"

import { createContext, ReactNode, useContext } from "react"
import type { Member } from "@/lib/data/dummy-data"
import type { DateRange } from "@/components/insights/types"

export interface SelectedMemberContextValue {
  selectedMemberId: string | null
  selectedMember: Member | null
  dateRange: DateRange
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

// Backward compatibility: selectedDate is now dateRange.startDate
export function useSelectedDate() {
  const context = useSelectedMemberContext()
  return context.dateRange.startDate
}

