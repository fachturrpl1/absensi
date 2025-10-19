"use server";

import { createClient } from "@/utils/supabase/server";
import { IUser, IOrganization_member, IEmergencyContact } from "@/interface";
import { revalidatePath } from "next/cache";

interface UserProfile extends Partial<IUser> {
  email?: string;
}

interface AccountData {
  user: UserProfile;
  organizationMember: IOrganization_member | null;
}

interface Base64UploadData {
  base64Data: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

// Get current user account data
export async function getAccountData(): Promise<{
  success: boolean;
  data?: AccountData;
  message?: string;
}> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    // Get user profile data
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Profile error:', profileError);
    }

    // Get organization member data with relations
    const { data: orgMember, error: orgMemberError } = await supabase
      .from('organization_members')
      .select(`
        *,
        organization:organizations(*),
        departments!organization_members_department_id_fkey(*),
        positions(*),
        user:user_profiles(*)
      `)
      .eq('user_id', user.id)
      .maybeSingle();

    if (orgMemberError) {
      console.error('Org member error:', orgMemberError);
    }

    const normalizedUserProfile: UserProfile = userProfile ? { ...userProfile } : {};

    const accountData: AccountData = {
      user: {
        ...normalizedUserProfile,
        email: user.email,
      },
      organizationMember: orgMember ?? null,
    };

    return {
      success: true,
      data: accountData,
    };
  } catch (error: unknown) {
    console.error('Get account data error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch account data',
    };
  }
}

// Update user profile
export async function updateUserProfile(profileData: Partial<UserProfile>): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    // Prepare update data (exclude email and id)
    const { email, ...updateData } = profileData;
    
    // Handle emergency_contact - ensure it's properly structured
    if (updateData.emergency_contact) {
      // If all fields are empty, set to null
      const ec = updateData.emergency_contact as IEmergencyContact;
      if (!ec.name && !ec.relationship && !ec.phone && !ec.email) {
        updateData.emergency_contact = null;
      }
    }
    
    // Update user profile in user_profiles table
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return {
        success: false,
        message: updateError.message || 'Failed to update profile',
      };
    }

    // If email is being updated, update it in auth
    if (email && email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: email,
      });
      
      if (emailError) {
        return {
          success: false,
          message: `Profile updated but email update failed: ${emailError.message}`,
        };
      }
    }

    revalidatePath('/account');
    return {
      success: true,
      message: 'Profile updated successfully',
    };
  } catch (error: unknown) {
    console.error('Update profile error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update profile',
    };
  }
}

// Update profile photo
export async function updateProfilePhoto(photoUrl: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    // Update profile photo URL
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        profile_photo_url: photoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return {
        success: false,
        message: updateError.message || 'Failed to update profile photo',
      };
    }

    revalidatePath('/account');
    return {
      success: true,
      message: 'Profile photo updated successfully',
    };
  } catch (error: unknown) {
    console.error('Update profile photo error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update profile photo',
    };
  }
}

// Change password
export async function changePassword(newPassword: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    // Update password
    const { error: passwordError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (passwordError) {
      return {
        success: false,
        message: passwordError.message || 'Failed to change password',
      };
    }

    return {
      success: true,
      message: 'Password changed successfully',
    };
  } catch (error: unknown) {
    console.error('Change password error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to change password',
    };
  }
}

// Helper function to delete old profile photo
export async function deleteOldProfilePhoto(oldPhotoUrl: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const supabase = await createClient();
    
    // Extract file path from URL
    // URL format: https://...supabase.co/storage/v1/object/public/profile-photos/users/user-id/filename
    const urlParts = oldPhotoUrl.split('/profile-photos/');
    if (urlParts.length < 2) {
      return { success: false, message: 'Invalid photo URL format' };
    }
    
    const filePath = urlParts[1]; // users/user-id/filename
    
    console.log('Deleting old photo:', filePath);
    
    // Delete file from Supabase Storage
    const { error } = await supabase.storage
      .from('profile-photos')
      .remove([filePath]);
    
    if (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        message: `Failed to delete old photo: ${error.message}`,
      };
    }
    
    console.log('Old photo deleted successfully:', filePath);
    return {
      success: true,
      message: 'Old photo deleted successfully',
    };
  } catch (error: unknown) {
    console.error('Delete old photo error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Upload profile photo using Base64 with improved folder structure
export async function uploadProfilePhotoBase64(uploadData: Base64UploadData): Promise<{
  success: boolean;
  message: string;
  url?: string;
  oldPhotoDeleted?: boolean;
}> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User authentication error:', userError);
      return { success: false, message: "User not authenticated" };
    }

    const { base64Data, fileName, fileType, fileSize } = uploadData;

    // Validate input
    if (!base64Data || !fileName || !fileType) {
      return { success: false, message: "Invalid upload data" };
    }

    console.log('Processing base64 upload:', {
      fileName,
      fileType,
      fileSize,
      base64Length: base64Data.length,
      userId: user.id
    });

    // Validate file type
    if (!fileType.startsWith('image/')) {
      return { success: false, message: "Only image files are allowed" };
    }

    // Validate file size (max 8MB)
    if (fileSize > 8 * 1024 * 1024) {
      return { success: false, message: "File size must be less than 8MB" };
    }

    // Get current user profile to check for existing photo
    const { data: currentProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('profile_photo_url')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }

    // Create user-specific folder structure: users/{user-id}/
    const userFolder = `users/${user.id}`;
    
    // Create unique filename (we may change extension after compression)
    const origExt = fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/gi, '') || 'jpg';
    const timestamp = Date.now();
    const baseFileName = `profile_${timestamp}`;

    try {
      if (typeof Buffer === "undefined") {
        throw new Error("File uploads are not supported in this deployment environment");
      }

      // Convert base64 to buffer
      const originalBuffer = Buffer.from(base64Data, 'base64');
      console.log('Buffer created:', { size: originalBuffer.length });

      // Try server-side compression using sharp
      let finalBuffer = originalBuffer;
      let finalContentType = 'image/webp';
      let finalExt = 'webp';

      try {
        const sharp = (await import('sharp')).default;
        const compressed = await sharp(originalBuffer)
          .rotate()
          .resize(400, 400, { fit: 'cover', withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer();

        // Only use compressed if it's actually smaller
        if (compressed.length < originalBuffer.length) {
          finalBuffer = Buffer.from(compressed);
          console.log('Compression applied:', { originalSize: originalBuffer.length, compressedSize: compressed.length });
        } else {
          finalBuffer = originalBuffer;
          // If not smaller, use original type/ext
          finalContentType = fileType;
          finalExt = origExt;
          console.log('Compression skipped (no size benefit).');
        }
      } catch (e) {
        // If sharp fails (e.g., not installed), fall back to original
        finalBuffer = originalBuffer;
        finalContentType = fileType;
        finalExt = origExt;
        console.warn('Image compression unavailable, uploading original buffer:', e instanceof Error ? e.message : e);
      }

      const newFileName = `${baseFileName}.${finalExt}`;
      const filePath = `${userFolder}/${newFileName}`;

      console.log('Upload path:', filePath);
      console.log('User folder:', userFolder);

      // Upload buffer to Supabase Storage
      const { error: uploadError, data: uploadResult } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, finalBuffer, {
          cacheControl: '3600',
          upsert: false, // Don't overwrite, create new file
          contentType: finalContentType,
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        return {
          success: false,
          message: `Upload failed: ${uploadError.message}`,
        };
      }

      console.log('Upload successful:', uploadResult);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      // Delete old photo if exists
      let oldPhotoDeleted = false;
      if (currentProfile?.profile_photo_url) {
        const deleteResult = await deleteOldProfilePhoto(currentProfile.profile_photo_url);
        oldPhotoDeleted = deleteResult.success;
        
        if (!deleteResult.success) {
          console.warn('Failed to delete old photo, but continuing with upload:', deleteResult.message);
        }
      }

      // Update user profile with new photo URL
      const updateResult = await updateProfilePhoto(publicUrl);
      
      if (!updateResult.success) {
        console.error('Profile update error:', updateResult.message);
        
        // If profile update fails, delete the uploaded file to maintain consistency
        try {
          await supabase.storage.from('profile-photos').remove([filePath]);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
        
        return updateResult;
      }

      return {
        success: true,
        message: 'Profile photo uploaded successfully',
        url: publicUrl,
        oldPhotoDeleted,
      };
    } catch (bufferError: unknown) {
      console.error('Buffer processing error:', bufferError);
      return {
        success: false,
        message: `Failed to process image data: ${bufferError instanceof Error ? bufferError.message : 'Unknown error'}`,
      };
    }
  } catch (error: unknown) {
    console.error('Upload profile photo base64 error:', error);
    return {
      success: false,
      message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Delete user's profile photo and clean up folder if empty
export async function deleteUserProfilePhoto(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, message: "User not authenticated" };
    }

    // Get current user profile
    const { data: currentProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('profile_photo_url')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return {
        success: false,
        message: `Failed to fetch profile: ${profileError.message}`,
      };
    }

    if (!currentProfile?.profile_photo_url) {
      return {
        success: true,
        message: 'No profile photo to delete',
      };
    }

    // Delete the photo file
    const deleteResult = await deleteOldProfilePhoto(currentProfile.profile_photo_url);
    
    if (!deleteResult.success) {
      return deleteResult;
    }

    // Clear profile_photo_url from database
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        profile_photo_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return {
        success: false,
        message: updateError.message || 'Failed to update profile',
      };
    }

    revalidatePath('/account');
    return {
      success: true,
      message: 'Profile photo deleted successfully',
    };
  } catch (error: unknown) {
    console.error('Delete profile photo error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete profile photo',
    };
  }
}
