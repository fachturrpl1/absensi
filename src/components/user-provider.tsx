"use client"

import { useEffect } from "react"
import { IUser } from "@/interface"
import { useAuthStore } from "@/store/user-store"

export function UserProvider({ user }: { user: Partial<IUser> | null | undefined }) {
  const setUser = useAuthStore((state) => state.setUser)

  useEffect(() => {
    setUser((current) => {
      if (!user) {
        return null
      }

      const resolvedDisplayName =
        user.display_name && user.display_name.trim() !== ""
          ? user.display_name
          : current?.display_name && current.display_name.trim() !== ""
            ? current.display_name
            : user.display_name ?? current?.display_name ?? null

      return {
        ...current,
        ...user,
        display_name: resolvedDisplayName,
      }
    })
  }, [user, setUser])

  return null
}
