export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // DashboardLayoutWrapper (di root layout) sudah handle SidebarProvider + AppSidebarNew + NavbarNew
  // Layout ini hanya render children
  return children
}
