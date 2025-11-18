'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Calendar,
  MapPin,
  Settings,
  Building2,
  UserCog,
  Shield,
  Clock,
  ChevronRight,
  PanelsTopLeft,
  ChevronsLeft,
  ChevronsRight,
  CalendarDays,
  FileText,
  BarChart3,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AppSidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  isMobile: boolean;
  onClose: () => void;
  onToggle: () => void;
}

interface MenuItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Members',
    icon: Users,
    children: [
      { title: 'All Members', href: '/members', icon: Users },
      { title: 'Add Member', href: '/members/add', icon: UserCog },
      { title: 'Invitations', href: '/settings/invitations', icon: Shield },
    ],
  },
  {
    title: 'Attendance',
    icon: ClipboardList,
    children: [
      { title: 'Records', href: '/attendance', icon: ClipboardList },
      { title: 'Check In', href: '/attendance/check-in', icon: Clock },
      { title: 'Locations', href: '/attendance/locations', icon: MapPin },
    ],
  },
  {
    title: 'Schedules',
    icon: Calendar,
    children: [
      { title: 'Work Schedules', href: '/schedule', icon: Calendar },
      { title: 'Member Schedules', href: '/member-schedules', icon: Users },
    ],
  },
  {
    title: 'Leaves',
    icon: CalendarDays,
    children: [
      { title: 'Dashboard', href: '/leaves', icon: BarChart3 },
      { title: 'New Request', href: '/leaves/new', icon: Plus },
  
    ],
  },
  {
    title: 'Organization',
    icon: Building2,
    children: [
      { title: 'Departments', href: '/group', icon: Building2 },
      { title: 'Positions', href: '/position', icon: UserCog },
      { title: 'Settings', href: '/organization/settings', icon: Settings },
    ],
  },
  {
    title: 'Administration',
    icon: Shield,
    children: [
      { title: 'Users', href: '/users', icon: Users },
      { title: 'Roles', href: '/role', icon: Shield },
      { title: 'Permissions', href: '/permission', icon: Settings },
    ],
  },
];

function NavItem({
  item,
  isCollapsed,
  depth = 0,
}: {
  item: MenuItem;
  isCollapsed: boolean;
  depth?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.href === pathname || item.children?.some(child => child.href === pathname);

  const Icon = item.icon;

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const content = (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
        'hover:bg-accent hover:text-accent-foreground',
        isActive && 'bg-primary text-primary-foreground hover:bg-primary/90',
        depth > 0 && 'ml-4',
        isCollapsed && depth === 0 && 'justify-center'
      )}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0', isCollapsed && 'h-6 w-6')} />
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate">{item.title}</span>
          {item.badge && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs">
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-4 w-4" />
            </motion.div>
          )}
        </>
      )}
    </div>
  );

  if (isCollapsed && depth === 0) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            {item.href ? (
              <Link href={item.href}>{content}</Link>
            ) : (
              <button onClick={handleClick} className="w-full">
                {content}
              </button>
            )}
          </TooltipTrigger>
          <TooltipContent side="right" className="flex flex-col gap-1">
            <span className="font-semibold">{item.title}</span>
            {hasChildren && (
              <div className="flex flex-col gap-1 mt-1">
                {item.children?.map((child) => (
                  <Link
                    key={child.title}
                    href={child.href || '#'}
                    className="text-xs hover:underline"
                  >
                    {child.title}
                  </Link>
                ))}
              </div>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div>
      {item.href ? (
        <Link href={item.href} onClick={handleClick}>
          {content}
        </Link>
      ) : (
        <button onClick={handleClick} className="w-full">
          {content}
        </button>
      )}

      {/* Children */}
      <AnimatePresence>
        {hasChildren && isExpanded && !isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1 space-y-1">
              {item.children?.map((child) => (
                <NavItem
                  key={child.title}
                  item={child}
                  isCollapsed={false}
                  depth={depth + 1}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AppSidebar({
  isOpen,
  isCollapsed,
  isMobile,
  onClose,
  onToggle,
}: AppSidebarProps) {
  return (
    <>
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isMobile ? (isOpen ? 0 : -280) : 0,
          width: isMobile ? 280 : isCollapsed ? 80 : 280,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'fixed left-0 top-0 z-50 h-screen border-r bg-card',
          'flex flex-col',
          isMobile && 'shadow-2xl'
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex h-16 items-center border-b px-4',
            isCollapsed && !isMobile && 'justify-center'
          )}
        >
          {!isCollapsed || isMobile ? (
            <>
              <Link href="/" className="flex items-center gap-2" onClick={isMobile ? onClose : undefined}>
                <PanelsTopLeft className="h-6 w-6 text-primary" />
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
                >
                  Presensi
                </motion.span>
              </Link>
              <div className="ml-auto">
                {!isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggle}
                    className="h-8 w-8"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-8 w-8"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <NavItem key={item.title} item={item} isCollapsed={isCollapsed && !isMobile} />
            ))}
          </nav>
        </ScrollArea>

        {/* Footer */}
        {(!isCollapsed || isMobile) && (
          <div className="border-t p-4">
            <div className="text-xs text-muted-foreground">
              <p className="font-semibold">Presensi v1.0</p>
              <p>Multi-Tenant Attendance</p>
            </div>
          </div>
        )}
      </motion.aside>
    </>
  );
}
