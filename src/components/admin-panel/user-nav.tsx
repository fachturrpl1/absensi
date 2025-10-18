"use client"

import Link from "next/link"
import { LayoutGrid, LogOut, User, RefreshCw } from "lucide-react"
import React from "react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/store/user-store"
import { useProfileRefresh, useProfilePhotoUrl } from "@/hooks/use-profile"
import { safeAvatarSrc, getUserInitials } from "@/lib/avatar-utils"
import LogoutButton from "../logout"
import { LanguageDropdownItem } from "@/components/language-dropdown-item"

export function UserNav() {
  const user = useAuthStore((state) => state.user)
  const { refreshProfile } = useProfileRefresh()
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const profilePhotoUrl = useProfilePhotoUrl(user?.profile_photo_url ?? undefined)

  // Auto-refresh profile data on component mount
  React.useEffect(() => {
    if (user?.id && process.env.NODE_ENV === 'development') {
      console.log('UserNav - Profile photo URL:', {
        original: user.profile_photo_url,
        processed: profilePhotoUrl
      })
    }
  }, [user, profilePhotoUrl])

  if (!user) return null

  // Function to manually refresh user data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshProfile()
    } finally {
      setIsRefreshing(false)
    }
  }

  // Get full name from user data
  const getFullName = () => {
    const nameParts = [user.first_name, user.middle_name, user.last_name]
      .filter((part): part is string => Boolean(part && part.trim()))

    if (user.display_name && user.display_name.trim() !== '') {
      return user.display_name
    }

    if (user.display_name && user.display_name.trim() !== '') {
      return user.display_name
    }

    if (nameParts.length > 0) {
      return nameParts.join(' ')
    }

    return user.email || 'User'
  }

  const fullName = getFullName()

  return (
    <DropdownMenu>
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="relative h-8 w-8 rounded-full"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={safeAvatarSrc(profilePhotoUrl)}
                    alt={fullName}
                    className="object-cover"
                    onError={(e) => {
                      if (process.env.NODE_ENV === 'development') {
                        console.log('Avatar image load failed:', profilePhotoUrl)
                      }
                      // Hide image if it fails to load
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
                    {getUserInitials(
                      user.first_name,
                      user.last_name,
                      user.display_name,
                      user.email
                    )}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">Profile</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none">{fullName}</p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Refresh profile data"
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {user.employee_code && (
              <p className="text-xs leading-none text-muted-foreground">
                ID: {user.employee_code}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="hover:cursor-pointer" asChild>
            <Link href="/" className="flex items-center">
              <LayoutGrid className="w-4 h-4 mr-3 text-muted-foreground" />
              Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:cursor-pointer" asChild>
            <Link href="/account" className="flex items-center">
              <User className="w-4 h-4 mr-3 text-muted-foreground" />
              Account Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="hover:cursor-pointer" onClick={() => { }}>
          <LogoutButton />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
