'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Sun,
  Moon,
  Monitor,
  Plus,
  UserPlus,
  Clock,
  MapPin,
  LayoutDashboard,
  Users,
  ClipboardList,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { SearchDialog } from './search-dialog';

export function NavbarNew() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [notificationCount] = useState(3);

  // Keyboard shortcuts - Only for Quick Actions
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if Cmd/Ctrl is pressed
      if (!(event.metaKey || event.ctrlKey)) return;

      switch (event.key.toLowerCase()) {
        case 'n':
          event.preventDefault();
          router.push('/members?action=invite');
          break;
        case 'i':
          event.preventDefault();
          router.push('/attendance/add');
          break;
        case 'l':
          event.preventDefault();
          router.push('/attendance/locations/new');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // Quick access shortcuts - Removed keyboard shortcuts
  const quickAccess = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: Users, label: 'Members', href: '/members' },
    { icon: ClipboardList, label: 'Attendance', href: '/attendance' },
    { icon: Calendar, label: 'Schedules', href: '/schedule' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  ];

  const quickActions = [
    { icon: UserPlus, label: 'Invite Member', href: '/members?action=invite', kbd: '⌘N' },
    { icon: Clock, label: 'Manual Attendance', href: '/attendance/add', kbd: '⌘I' },
    { icon: MapPin, label: 'Add Location', href: '/attendance/locations/new', kbd: '⌘L' },
  ];

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Overview</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Quick Access - Desktop */}
      <div className="ml-auto hidden lg:flex items-center gap-1">
        {quickAccess.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => router.push(item.href)}
          >
            <item.icon className="h-4 w-4" />
            <span className="hidden xl:inline">{item.label}</span>
          </Button>
        ))}
        <Separator orientation="vertical" className="mx-2 h-4" />
      </div>

      {/* Right Side Actions */}
      <div className="ml-auto lg:ml-0 flex items-center gap-2">
        {/* Search */}
        <SearchDialog />
        
        {/* Quick Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline">New</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {quickActions.map((action) => (
              <DropdownMenuItem
                key={action.href}
                onClick={() => router.push(action.href)}
                className="cursor-pointer"
              >
                <action.icon className="mr-2 h-4 w-4" />
                {action.label}
                <DropdownMenuShortcut>{action.kbd}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center"
                >
                  {notificationCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto">
              {[1, 2, 3].map((i) => (
                <DropdownMenuItem key={i} className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                  <p className="text-sm font-medium">New attendance record</p>
                  <p className="text-xs text-muted-foreground">
                    John Doe checked in at 09:00 AM
                  </p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-sm text-primary cursor-pointer">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
