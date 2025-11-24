'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserStore } from '@/store/user-store';
import { useMounted } from '@/hooks/use-mounted';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Calendar,
  MapPin,
  Building2,
  Briefcase,
  BarChart3,
  Settings,
  Command,
  ChevronRight,
  CalendarDays,
  Plus,
  ListChecks,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { NavUser } from './nav-user';

interface NavSubItem {
  title: string;
  url: string;
  icon?: any;
  badge?: string;
  requiresAdmin?: boolean;
}

interface NavMainItem {
  title: string;
  url?: string;
  icon: any;
  subItems?: NavSubItem[];
  badge?: string;
}

interface NavGroup {
  label?: string;
  items: NavMainItem[];
}

const getSidebarGroups = (): NavGroup[] => [
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        url: '/',
        icon: LayoutDashboard,
      },
      {
        title: 'Analytics',
        url: '/analytics',
        icon: BarChart3,
      },
    ],
  },
  {
    label: 'Management',
    items: [
      {
        title: 'Members',
        url: '/members',
        icon: Users,
      },
      {
        title: 'Attendance',
        url: '/attendance',
        icon: ClipboardList,
      },
      {
        title: 'Schedules',
        icon: Calendar,
        subItems: [
          { title: 'Work Schedules', url: '/schedule', icon: Calendar },
          { title: 'Member Schedules', url: '/member-schedules', icon: Users },
        ],
      },
      {
        title: 'Locations',
        url: '/attendance/locations',
        icon: MapPin,
      },
      {
        title: 'Leaves',
        icon: CalendarDays,
        subItems: [
          { title: 'Dashboard', url: '/leaves', icon: BarChart3 },
          { title: 'New Request', url: '/leaves/new', icon: Plus },
          { title: 'Manage Types', url: '/leaves/types', icon: ListChecks, requiresAdmin: true },
        ],
      },
    ],
  },
  {
    label: 'Organization',
    items: [
      {
        title: 'Groups',
        url: '/group',
        icon: Building2,
      },
      {
        title: 'Positions',
        url: '/position',
        icon: Briefcase,
      },
      {
        title: 'Settings',
        url: '/organization/settings',
        icon: Settings,
      },
    ],
  },
];

function NavMain({ items }: { items: NavMainItem[] }) {
  const pathname = usePathname();
  const { role, permissions } = useUserStore();
  const mounted = useMounted();
  
  // Debug logging
  console.log('🔍 Sidebar Debug:', { role, permissions });
  
  // Role codes: A001 = Admin Org, SA001 = Super Admin
  const isAdmin = role === 'A001' || role === 'SA001';
  const canManageLeaveTypes = permissions?.includes('leaves:type:manage') || isAdmin;
  
  console.log('✅ Admin Check:', { isAdmin, canManageLeaveTypes });

  if (!mounted) {
    return <div suppressHydrationWarning />;
  }

  return (
    <SidebarMenu>
      {items.map((item) => {
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const isActive = item.url === pathname || item.subItems?.some(sub => sub.url === pathname);

        if (hasSubItems) {
          return (
            <Collapsible key={item.title} asChild defaultOpen={isActive} className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.badge && (
                      <Badge variant="outline" className="ml-auto text-xs">
                        {item.badge}
                      </Badge>
                    )}
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.subItems?.filter(subItem => {
                      // Filter out admin-only items if user is not admin
                      if (subItem.requiresAdmin && !canManageLeaveTypes) {
                        return false;
                      }
                      return true;
                    }).map((subItem) => {
                      const isSubActive = subItem.url === pathname;
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={isSubActive}>
                            <Link href={subItem.url}>
                              {subItem.icon && <subItem.icon className="h-4 w-4" />}
                              <span>{subItem.title}</span>
                              {subItem.badge && (
                                <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                                  {subItem.badge}
                                </Badge>
                              )}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        }

        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
              <Link href={item.url || '#'}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
                {item.badge && (
                  <Badge variant="outline" className="ml-auto text-xs">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export function AppSidebarNew({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const sidebarGroups = getSidebarGroups();
  const mounted = useMounted();
  
  return (
    <Sidebar collapsible="icon" suppressHydrationWarning {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Attendance</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        {mounted && sidebarGroups.map((group) => (
          <SidebarGroup key={group.label || 'default'}>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <NavMain items={group.items} />
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
