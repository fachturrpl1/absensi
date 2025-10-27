"use client"

import { Button } from "@/components/ui/button"
import { logout } from "@/action/users"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { useAuthStore } from "@/store/user-store"
import { cn } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"

export default function LogoutButton({ className, compact }: { className?: string; compact?: boolean }) {
  const router = useRouter()
  const setUser = useAuthStore((state) => state.setUser)
  const queryClient = useQueryClient()

const handleLogout = async () => {
  const result = await logout()
  if (result.success) {
    // Clear all React Query cache to prevent data leakage
    queryClient.clear()
    
    // Clear user state
    setUser(null)
    
    // Refresh server state and navigate
    router.refresh()
    router.replace("/auth/login")
  } else {
    alert(result.error)
  }
}

  if (compact) {
    return (
      <Button
        variant="ghost"
        className={cn("h-10 w-10 p-0 justify-center", className)}
        onClick={handleLogout}
        aria-label="Log out"
      >
        <LogOut />
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      className={cn("w-full justify-start", className)}
      onClick={handleLogout}
    >
      <LogOut className="mr-2" />
      Log out
    </Button>
  )
}

