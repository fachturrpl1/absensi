import { create } from "zustand";

interface OrgState {
  organizationId: number | null;
  timezone: string;
  setOrganizationId: (id: number | null) => void;
  setTimezone: (tz: string) => void;
  reset: () => void;
}

export const useOrgStore = create<OrgState>((set) => ({
  organizationId: null,
  timezone: "UTC",
  setOrganizationId: (id) => set({ organizationId: id }),
  setTimezone: (tz) => set({ timezone: tz }),
  reset: () => set({ organizationId: null, timezone: "UTC" }),
}));
