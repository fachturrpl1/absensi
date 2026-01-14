'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserStore } from '@/store/user-store';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Briefcase,
  BarChart3,
  Settings,
  Command,
  ChevronRight,
  ListChecks,
  Cpu,
  Fingerprint,
  Clock3,
  TrendingUp,
  Lightbulb,
  Folder,
  Columns2,
  FileUser,
  Fullscreen,
  HighlighterIcon,
  Gauge,
  History,
  Bell,
  SquareArrowOutUpRight,
  MousePointer2,
  ClockPlus,
  Notebook,
  LucideNotebookText,
  CalendarCheck2,
  Activity,
  Link as LinkIcon,
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
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: string;
  requiresAdmin?: boolean;
  hideOn?: string[]; // Hide on specific routes
}

interface NavMainItem {
  title: string;
  url?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  subItems?: NavSubItem[];
  badge?: string;
  hideOn?: string[]; // Hide on specific routes
}

interface NavGroup {
  label?: string;
  items: NavMainItem[];
}

// Helper function untuk determine menu visibility berdasarkan pathname
const shouldShowMenuItem = (pathname: string, itemTitle: string): boolean => {
  // Di halaman /organization, hanya tampilkan All Organizations saja
  if (pathname.startsWith('/organization')) {
    // Hanya tampilkan All Organizations menu
    return itemTitle === 'All Organizations'
  }

  // Di halaman lain, sembunyikan menu organization
  if (itemTitle === 'All Organizations') {
    return false
  }

  // Tampilkan menu lainnya (termasuk Fingerprint Scanner)
  return true
}

const getSidebarGroups = (): NavGroup[] => [
  {
    items: [
      {
        title: 'Home',
        url: '/',
        icon: LayoutDashboard,
      },
      {
        title: 'Timesheets',
        icon: Clock3,
        subItems:[
          { title: 'View & edit', url: '/', icon:Columns2},
          { title: 'Approvals', url: '/', icon:FileUser },
        ]
      },
      {
        title: 'Attendance',
        icon: ClipboardList,
        subItems: [
          { title: 'Dashboard', url: '/attendance', icon: BarChart3 },
          { title: 'Attendance List', url: '/attendance/list', icon: ListChecks },
          { title: 'Locations', url: '/attendance/locations', icon: MapPin },
          { title: 'Devices', url: '/attendance-devices', icon: Cpu },
        ],
      },
      {
        title:'Activity',
        icon: TrendingUp,
        subItems:[
          { title: 'Screenshots', url: '/', icon:Fullscreen},
          { title: 'Apps', url: '/', icon:Folder },
          { title: 'URLs', url: '/', icon:LinkIcon },
        ]
      },
      {
        title:'Insight',
        icon:Lightbulb,
        subItems:[
          { title: 'Hightlights', url:'/', icon:HighlighterIcon},
          { title: 'Performance', url: '/', icon:Gauge},
          { title: 'Timeline', url: '/', icon:History},
          { title: 'Unusual Activity', url: '/', icon:Activity},
          { title: 'Smart Notifications', url: '/', icon:Bell},
          { title: 'Output', url: '/', icon:SquareArrowOutUpRight },
        ]
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
        title:'Project management',
        icon:Folder,
        subItems:[
          { title: 'Projects', url: '/', icon:Folder},
          { title: 'Tasks', url: '/', icon:ClipboardList},
          { title: 'Clients',url:'/', icon:MousePointer2}
        ]
      },
      {
        title: 'Shift',
        icon: Clock,
        subItems: [
          { title: 'Shift Management', url: '/shift/management', icon: Clock },
          { title: 'Shift Assignment', url: '/shift/assignment', icon: Users },
        ],
      },
      {
        title:'Reports',
        icon:ClipboardList,
        subItems:[
          { title: 'Time & activity', url: '/', icon:ClockPlus},
          { title: 'Activity', url: '/', icon:Activity},
          { title: 'Daily totals', url: '/', icon:CalendarCheck2},
          { title: 'Project management', url: '/', icon:Folder},
          { title: 'All reports', url: '/', icon:Notebook},
          { title: 'Customized reports', url: '/', icon:LucideNotebookText},
        ]
      },
      {
        title: 'All Organizations',
        url: '/organization',
        icon: Building2,
      },
      {
        title: 'Organization',
        icon: Users,
        subItems: [
          { title: 'Members', url: '/members', icon: Users },
          { title: 'Fingerprint', url: '/finger', icon: Fingerprint },
          { title: 'Groups', url: '/group', icon: Building2 },
          { title: 'Positions', url: '/position', icon: Briefcase },
        ],
      },
      {
        title: 'Settings',
        url: '/settings',
        icon: Settings,
      },
    ],
  },
];

function NavMain({ items }: { items: NavMainItem[] }) {
  const pathname = usePathname();
  const { role, permissions } = useUserStore();
  const [isHydrated, setIsHydrated] = useState(false)
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Debug logging
  console.log('🔍 Sidebar Debug:', { role, permissions });

  // Role codes: A001 = Admin Org, SA001 = Super Admin
  const isAdmin = role === 'A001' || role === 'SA001';
  const canManageLeaveTypes = isHydrated && (permissions?.includes('leaves:type:manage') || isAdmin);

  console.log('✅ Admin Check:', { isAdmin, canManageLeaveTypes });

  return (
    <SidebarMenu>
      {items.map((item) => {
        // Check if menu should be shown based on current pathname
        if (!shouldShowMenuItem(pathname, item.title)) {
          return null
        }

        const hasSubItems = item.subItems && item.subItems.length > 0;
        const isActive = item.url === pathname || item.subItems?.some(sub => sub.url === pathname);

        if (hasSubItems) {
          return (
            <SidebarMenuItem key={item.title} className="group/collapsible">
              <Collapsible
                open={isHydrated ? (openItems[item.title] ?? isActive) : false}
                onOpenChange={(v) => setOpenItems((prev) => ({ ...prev, [item.title]: v }))}
                className="group/collapsible"
              >
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
              </Collapsible>
            </SidebarMenuItem>
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
  const [mounted, setMounted] = useState(false)
  const sidebarGroups = getSidebarGroups();

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        data-slot="sidebar-wrapper"
        className="group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full"
        suppressHydrationWarning
      />
    )
  }

  return (
    <Sidebar collapsible="icon" {...props}>
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
        {sidebarGroups.map((group, index) => (
          <SidebarGroup key={`group-${index}`}>
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
