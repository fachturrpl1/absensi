import { ContentLayout } from "@/components/admin-panel/content-layout"
import { getAllUsers } from "@/action/users"
import UsersClient from "./users-client"
import { IUser } from "@/interface"

// Server Component - fetch data di server
export default async function UsersPage() {
  // Fetch data di server - 1 request!
  const response = await getAllUsers()
  const users = (response.success ? response.data : []) as IUser[]

  return (
    <ContentLayout title="Users">
      <UsersClient initialUsers={users} />
    </ContentLayout>
  )
}
