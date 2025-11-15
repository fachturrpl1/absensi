"use client"

import { useCallback } from 'react'
import { IUser } from '@/interface'
import { useAuthStore } from '@/store/user-store'
import { getAccountData } from '@/action/account'

import { logger } from '@/lib/logger';
/**
 * Hook for refreshing user profile data
 * Automatically refreshes user data when profile photo changes
 */
export function useProfileRefresh() {
  const setUser = useAuthStore((state) => state.setUser)
  const user = useAuthStore((state) => state.user)

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return false

    try {
      const result = await getAccountData()
      if (result.success && result.data?.user) {
        const incoming = result.data.user
        setUser((current) => {
          const base: Partial<IUser> = current ?? {}

          const profilePhoto =
            typeof incoming.profile_photo_url === "undefined"
              ? base.profile_photo_url ?? null
              : incoming.profile_photo_url

          const incomingDisplayName =
            typeof incoming.display_name === "undefined"
              ? undefined
              : incoming.display_name

          const normalizedIncomingDisplayName =
            typeof incomingDisplayName === "string" && incomingDisplayName.trim() === ""
              ? null
              : incomingDisplayName ?? null

          const normalizedBaseDisplayName =
            typeof base.display_name === "string" && base.display_name.trim() === ""
              ? null
              : base.display_name ?? null

          const fallbackName =
            [incoming.first_name || base.first_name || "", incoming.middle_name || base.middle_name || "", incoming.last_name || base.last_name || ""]
              .filter((part) => part && part.trim() !== "")
              .join(" ") || null

          return {
            ...base,
            ...incoming,
            profile_photo_url: profilePhoto ?? null,
            display_name: normalizedIncomingDisplayName ?? normalizedBaseDisplayName ?? fallbackName,
            email: incoming.email ?? base.email,
          } as IUser
        })
        return true
      }
      return false
    } catch (error) {
      logger.error('Failed to refresh user profile:', error)
      return false
    }
  }, [setUser, user?.id])

  // Auto refresh disabled to reduce duplicate requests
  // Components should call refreshProfile() explicitly when needed
  // useEffect(() => {
  //   if (user && user.id) {
  //     refreshProfile()
  //   }
  // }, [refreshProfile, user?.id])

  return {
    refreshProfile,
    user,
  }
}

/**
 * Hook for handling profile photo URL
 * Returns properly formatted profile photo URL with support for new folder structure
 */
export function useProfilePhotoUrl(profilePhotoUrl?: string) {
  const getValidProfilePhotoUrl = () => {
    if (!profilePhotoUrl) return undefined
    
    // Check if it's a complete URL (already processed)
    if (profilePhotoUrl.startsWith('http')) {
      return profilePhotoUrl
    }
    
    // Handle Supabase storage URL construction
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl) {
      
      let constructedUrl = ''
      
      if (profilePhotoUrl.startsWith('/storage/v1/object/public/')) {
        // Already a full storage path
        constructedUrl = `${supabaseUrl}${profilePhotoUrl}`
      } else if (profilePhotoUrl.startsWith('profile-photos/')) {
        // Bucket relative path
        constructedUrl = `${supabaseUrl}/storage/v1/object/public/${profilePhotoUrl}`
      } else if (profilePhotoUrl.includes('/profile-photos/') || profilePhotoUrl.includes('users/')) {
        // Contains profile-photos or users path
        const cleanPath = profilePhotoUrl.replace(/^\//, '') // Remove leading slash
        constructedUrl = `${supabaseUrl}/storage/v1/object/public/profile-photos/${cleanPath}`
      } else {
        // Fallback: treat as filename in profile-photos bucket
        const cleanPath = profilePhotoUrl.replace(/^\//, '')
        constructedUrl = `${supabaseUrl}/storage/v1/object/public/profile-photos/${cleanPath}`
      }
      
      return constructedUrl
    }
    
    // Fallback: If it's a relative path, prepend API base URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
    return `${baseUrl}${profilePhotoUrl.startsWith('/') ? '' : '/'}${profilePhotoUrl}`
  }

  return getValidProfilePhotoUrl()
}

/**
 * Hook for deleting profile photo
 * Provides a convenient way to delete user's profile photo
 */
export function useProfilePhotoDelete() {
  const { refreshProfile } = useProfileRefresh()
  const setUser = useAuthStore((state) => state.setUser)
  const currentUser = useAuthStore((state) => state.user)
  
  const deleteProfilePhoto = async (): Promise<{
    success: boolean
    message: string
  }> => {
    try {
      // Import the delete function dynamically to avoid circular imports
      const { deleteUserProfilePhoto } = await import('@/action/account')
      
      const result = await deleteUserProfilePhoto()
      
      if (result.success && currentUser) {
        // Update user data in store immediately
        setUser({
          ...currentUser,
          profile_photo_url: null, // Use null instead of undefined
        })
        
        // Refresh from server to ensure consistency
        await refreshProfile()
      }
      
      return result
    } catch (error) {
      logger.error('Delete profile photo error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  return { deleteProfilePhoto }
}
