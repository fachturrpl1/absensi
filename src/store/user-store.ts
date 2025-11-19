import { create } from "zustand"
import { IUser } from "@/interface"

type UserUpdater = IUser | null | ((currentUser: IUser | null) => IUser | null)

interface AuthState {
  user: IUser | null
  role: string | null
  permissions: string[]
  setUser: (updater: UserUpdater) => void
  setRole: (role: string | null) => void
  setPermissions: (permissions: string[]) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  permissions: [],
  setUser: (updater) =>
    set((state) => ({
      user:
        typeof updater === "function"
          ? (updater as (u: IUser | null) => IUser | null)(state.user)
          : updater,
    })),
  setRole: (role) => set({ role }),
  setPermissions: (permissions) => set({ permissions }),
  reset: () => set({ user: null, role: null, permissions: [] }),
}))

// Alias for backward compatibility
export const useUserStore = useAuthStore
