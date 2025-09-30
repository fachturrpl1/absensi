import { create } from "zustand"
import { IUser } from "@/interface"

interface AuthState {
  user: IUser | null
  permissions: string[]
  setUser: (user: IUser | null) => void
  setPermissions: (permissions: string[]) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  permissions: [],
  setUser: (user) => set({ user }),
  setPermissions: (permissions) => set({ permissions }),
  reset: () => set({ user: null, permissions: [] }),
}))
