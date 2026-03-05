import type { DateRange } from "@/components/reuseable/date-picker"

export type { DateRange }

export type FilterTab = "members" | "teams"

export interface PickerItem {
  id: string
  name: string
}

export interface SelectedFilter {
  type: "members" | "teams"
  all: boolean
  id?: string
}

