import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebarNew } from '@/components/layout-new/app-sidebar-new';
import { NavbarNew } from '@/components/layout-new/navbar-new';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebarNew />
      <SidebarInset>
        <NavbarNew />
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
