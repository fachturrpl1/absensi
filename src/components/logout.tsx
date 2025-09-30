"use client"

import { Button } from "@/components/ui/button"
import { logout } from "@/action/users"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { useAuthStore } from "@/store/user-store"
import { cn } from "@/lib/utils"

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter()
  const setUser = useAuthStore((state) => state.setUser)

const handleLogout = async () => {
  const result = await logout()
  if (result.success) {
    setUser(null)
    router.refresh()  // ⬅️ penting untuk sync server + client
    router.replace("/auth/login")
  } else {
    alert(result.error)
  }
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

