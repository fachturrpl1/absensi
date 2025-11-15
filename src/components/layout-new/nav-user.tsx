'use client';

import { useEffect, useState } from 'react';
import { EllipsisVertical, CircleUser, Settings, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface UserProfile {
  name: string;
  email: string;
  avatar: string | null;
}

export function NavUser() {
  const { isMobile } = useSidebar();
  const [user, setUser] = useState<UserProfile>({
    name: 'Loading...',
    email: '',
    avatar: null,
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    
    const setupProfileAndSubscription = async () => {
      // Fetch current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) return;

      // Fetch user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name, middle_name, last_name, display_name, email, profile_photo_url')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        // Import utility for consistent display name logic
        const { getUserDisplayName } = await import('@/utils/user-display-name');
        const displayName = getUserDisplayName(profile);

        setUser({
          name: displayName,
          email: profile.email || authUser.email || '',
          avatar: profile.profile_photo_url,
        });
      }

      // Setup real-time subscription for profile changes
      channel = supabase
        .channel('user-profile-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_profiles',
            filter: `id=eq.${authUser.id}`,
          },
          async (payload) => {
            if (payload.new) {
              const newProfile = payload.new as any;
              
              // Import utility for consistent display name logic
              const { getUserDisplayName } = await import('@/utils/user-display-name');
              const displayName = getUserDisplayName(newProfile);

              setUser({
                name: displayName,
                email: newProfile.email || authUser.email || '',
                avatar: newProfile.profile_photo_url,
              });
            }
          }
        )
        .subscribe();
    };

    setupProfileAndSubscription();

    // Cleanup on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    // Import complete logout handler
    const { handleCompleteLogout } = await import('@/utils/logout-handler');
    await handleCompleteLogout();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user.avatar || undefined} alt={user.name} className="object-cover" />
                <AvatarFallback className="rounded-lg">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs">{user.email}</span>
              </div>
              <EllipsisVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar || undefined} alt={user.name} className="object-cover" />
                  <AvatarFallback className="rounded-lg">{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/account">
                  <CircleUser />
                  Account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/organization/settings">
                  <Settings />
                  Settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
              <LogOut />
              {isLoggingOut ? 'Logging out...' : 'Log out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
