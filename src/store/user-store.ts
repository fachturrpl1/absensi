import { create } from "zustand"
import { IUser } from "@/interface"

type UserUpdater = IUser | null | ((currentUser: IUser | null) => IUser | null)

interface AuthState {
  user: IUser | null
  permissions: string[]
  setUser: (updater: UserUpdater) => void
  setPermissions: (permissions: string[]) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  permissions: [],
  setUser: (updater) =>
    set((state) => ({
      user:
        typeof updater === "function"
          ? (updater as (u: IUser | null) => IUser | null)(state.user)
          : updater,
    })),
  setPermissions: (permissions) => set({ permissions }),
  reset: () => set({ user: null, permissions: [] }),
}))
