import { useAuthStore } from "@/store/user-store"

type CanProps = {
  permission: string
  children: React.ReactNode
}

export function Can({ permission, children }: CanProps) {
  const permissions = useAuthStore((state) => state.permissions)
  console.log("CHECK PERMISSION:", permission, permissions)
  return permissions.includes(permission) ? <>{children}</> : null
  

}

