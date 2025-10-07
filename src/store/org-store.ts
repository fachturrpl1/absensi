import { create } from "zustand";

interface OrgState {
  timezone: string;
  setTimezone: (tz: string) => void;
}

export const useOrgStore = create<OrgState>((set) => ({
  timezone: "UTC",
  setTimezone: (tz) => set({ timezone: tz }),
}));
