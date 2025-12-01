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
      <SidebarInset className="flex flex-col min-w-0">
        <NavbarNew />
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6 w-full min-w-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
