'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Menu,
  Search,
  Settings,
  User,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
  Command,
  Home,
  Users,
  ClipboardList,
  Calendar,
  Building2,
  BarChart3,
  Plus,
  UserPlus,
  MapPin,
  Clock,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface NavbarWithShortcutsProps {
  onMenuClick: () => void;
  isMobile: boolean;
}

export function NavbarWithShortcuts({ onMenuClick, isMobile }: NavbarWithShortcutsProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [notificationCount] = useState(3);

  // Quick access shortcuts
  const shortcuts = [
    {
      icon: Home,
      label: 'Dashboard',
      href: '/',
      shortcut: '⌘D',
    },
    {
      icon: Users,
      label: 'Members',
      href: '/members',
      shortcut: '⌘M',
    },
    {
      icon: ClipboardList,
      label: 'Attendance',
      href: '/attendance',
      shortcut: '⌘A',
    },
    {
      icon: Calendar,
      label: 'Schedules',
      href: '/schedule',
      shortcut: '⌘S',
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      href: '/analytics',
      shortcut: '⌘R',
    },
  ];

  const quickActions = [
    {
      icon: UserPlus,
      label: 'Add Member',
      href: '/members/add',
      shortcut: '⌘N',
    },
    {
      icon: Clock,
      label: 'Check In',
      href: '/attendance/check-in',
      shortcut: '⌘I',
    },
    {
      icon: MapPin,
      label: 'Add Location',
      href: '/attendance/locations/new',
      shortcut: '⌘L',
    },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        {/* Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="h-9 w-9"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Quick Access Shortcuts - Desktop Only */}
        {!isMobile && (
          <div className="hidden lg:flex items-center gap-1 border-r pr-4">
            {shortcuts.map((shortcut) => (
              <Button
                key={shortcut.href}
                variant="ghost"
                size="sm"
                asChild
                className="gap-2"
              >
                <Link href={shortcut.href}>
                  <shortcut.icon className="h-4 w-4" />
                  <span className="hidden xl:inline">{shortcut.label}</span>
                </Link>
              </Button>
            ))}
          </div>
        )}

        <div className="flex-1" />

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Actions Menu */}
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
                  <DropdownMenuShortcut>{action.shortcut}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Search Button */}
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex items-center gap-2"
            onClick={() => {
              const event = new KeyboardEvent('keydown', {
                key: 'k',
                metaKey: true,
                ctrlKey: true,
              });
              document.dispatchEvent(event);
            }}
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <Command className="h-3 w-3" />K
            </kbd>
          </Button>

          {/* Mobile Search */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => {
              const event = new KeyboardEvent('keydown', {
                key: 'k',
                metaKey: true,
                ctrlKey: true,
              });
              document.dispatchEvent(event);
            }}
          >
            <Search className="h-5 w-5" />
          </Button>

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

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 gap-2 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src="/avatar.jpg" alt="User" />
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground font-semibold">
                    FA
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start text-left text-xs">
                  <span className="font-semibold">Fauzan</span>
                  <span className="text-muted-foreground">Admin</span>
                </div>
                <ChevronDown className="hidden md:block h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">Fauzan Ahmad</p>
                  <p className="text-xs text-muted-foreground">fauzan@example.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/account">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                    <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/organization/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                    <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
}
