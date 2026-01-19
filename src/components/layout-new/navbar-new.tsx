'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Sun,
  Moon,
  Monitor,
  UserPlus,
  Clock,
  MapPin,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { createClient } from '@/utils/supabase/client';
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
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { OrgBreadcrumb } from './org-breadcrumb';
import { useOrgStore } from '@/store/org-store';
// import { useUserStore } from '@/store/user-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationDropdown } from '@/components/notifications/notification-dropdown';

export function NavbarNew() {
  const router = useRouter();
  const pathname = usePathname();

  // We want to hide search and new buttons on the organization selection page
  const showActions = pathname !== '/organization';
  const { theme, setTheme } = useTheme();
  const { organizationName, organizationId, setOrganizationId } = useOrgStore();
  // const { user } = useUserStore();
  const [orgLogoUrl, setOrgLogoUrl] = useState<string | null>(null);

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

  // Hydrate org store from localStorage (and Supabase if needed) so OrgBreadcrumb can immediately show org name
  useEffect(() => {
    const hydrate = async () => {
      try {
        const raw = localStorage.getItem('org-store');
        if (!raw) return;
        const parsed = JSON.parse(raw);
        const state = (parsed?.state ?? parsed) as {
          organizationId?: number | null;
          organizationName?: string | null;
          organizations?: Array<{ id?: number; name?: string }>;
        };
        const storedId = state?.organizationId ?? null;
        const derivedName = state?.organizationName
          || (Array.isArray(state?.organizations)
                ? state.organizations.find(o => Number(o?.id) === Number(storedId))?.name
                : undefined);

        if (storedId && derivedName) {
          setOrganizationId(storedId, derivedName);
          return;
        }

        // As a last resort, fetch the organization name by ID
        if (storedId && !organizationName) {
          try {
            const supabase = createClient();
            const { data, error } = await supabase
              .from('organizations')
              .select('id, name, logo_url')
              .eq('id', storedId)
              .maybeSingle();
            if (!error && data?.name) {
              setOrganizationId(storedId, data.name);
              setOrgLogoUrl(data.logo_url ?? null);
            }
          } catch {}
        }
      } catch {}
    };

    if (!organizationId || !organizationName) {
      void hydrate();
    }
  }, [organizationName, organizationId, setOrganizationId]);

  // Ensure organization logo is loaded whenever organizationId changes
  useEffect(() => {
    const loadLogo = async () => {
      if (!organizationId) return;
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('organizations')
          .select('logo_url')
          .eq('id', organizationId)
          .maybeSingle();
        setOrgLogoUrl(data?.logo_url ?? null);
      } catch {}
    };
    void loadLogo();
  }, [organizationId]);

  const quickActions = [
    { icon: UserPlus, label: 'Invite Member', href: '/members?action=invite', kbd: '⌘N' },
    { icon: Clock, label: 'Manual Attendance', href: '/attendance/add', kbd: '⌘I' },
    { icon: MapPin, label: 'Add Location', href: '/attendance/locations/new', kbd: '⌘L' },
  ];

  // Safe helper to compute initials without unsafe indexing
  const getInitials = (name: string, fallback: string): string => {
    const trimmed = (name || '').trim();
    if (!trimmed) return fallback;
    const tokens = trimmed.split(/\s+/).filter(Boolean);
    if (tokens.length >= 2) {
      const a = tokens[0]?.charAt(0) ?? '';
      const b = tokens[1]?.charAt(0) ?? '';
      const res = (a + b).toUpperCase();
      return res || fallback;
    }
    const first = (tokens[0]?.slice(0, 2) ?? '').toUpperCase();
    return first || fallback;
  };

  // const userDisplayName = useMemo(() => {
  //   return (
  //     user?.display_name ||
  //     [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
  //     user?.email ||
  //     ''
  //   );
  // }, [user?.display_name, user?.first_name, user?.last_name, user?.email]);

  // const userInitials = useMemo(() => getInitials(userDisplayName, 'U'), [userDisplayName]);
  const orgInitials = useMemo(
    () => getInitials(organizationName ?? '', 'OR'),
    [organizationName]
  );

  // const handleLogout = async () => {
  //   try {
  //     const supabase = createClient();
  //     await supabase.auth.signOut();
  //   } catch {}
  //   router.replace('/login');
  // };

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <OrgBreadcrumb />
      </div>

      {/* Right Side Actions */}
      <div className="ml-auto flex items-center gap-2">
        {showActions && (
          <>
            {/* Search */}
            
            {/* Quick Actions */}
            <DropdownMenu>
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
          </>
        )}

        {/* Notifications */}
        <NotificationDropdown />

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
        
        <div className="flex items-center">
          {/* User dropdown */}
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="User profile">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profile_photo_url ?? undefined} alt="User avatar" />
                  <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user?.profile_photo_url ?? undefined} alt="User avatar" />
                    <AvatarFallback className="text-[10px]">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{userDisplayName || 'User'}</div>
                    {user?.email && (
                      <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer">
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}

          <Separator orientation="vertical" className="mx-2 h-6" />

          {/* Organization dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Organization profile">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={orgLogoUrl ?? undefined} alt="Organization logo" />
                  <AvatarFallback className="text-xs">{orgInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={orgLogoUrl ?? undefined} alt="Organization logo" />
                    <AvatarFallback className="text-[10px]">{orgInitials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{organizationName || 'Organization'}</div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/organization')} className="cursor-pointer">
                Organizations menu
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
                Organization settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
