// Utility functions for debugging Supabase storage issues
import { createClient } from '@/utils/supabase/client';

export const debugStorageAccess = async () => {
  try {
    const supabase = createClient();
    
    console.log('🔍 Debugging Supabase Storage Access...');
    
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return { success: false, error: bucketsError.message };
    }
    
    console.log('📦 Available buckets:', buckets?.map(b => b.name));
    
    // Check if 'logo' bucket exists
    const logoBucket = buckets?.find(b => b.name === 'logo');
    if (!logoBucket) {
      console.error('❌ Logo bucket not found!');
      return { success: false, error: 'Logo bucket does not exist' };
    }
    
    console.log('✅ Logo bucket found:', logoBucket);
    
    // Try to list files in the logo bucket
    const { data: files, error: filesError } = await supabase.storage
      .from('logo')
      .list('organization', { limit: 5 });
    
    if (filesError) {
      console.error('❌ Error accessing organization folder in logo bucket:', filesError);
      return { success: false, error: filesError.message };
    }
    
    console.log('📁 Files in organization folder:', files?.length || 0);
    
    // Test upload permissions (try uploading a test file)
    const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const testPath = `organization/test-${Date.now()}.txt`;
    
    const { error: uploadError } = await supabase.storage
      .from('logo')
      .upload(testPath, testFile);
    
    if (uploadError) {
      console.error('❌ Upload permission test failed:', uploadError);
      return { success: false, error: `Upload failed: ${uploadError.message}` };
    }
    
    console.log('✅ Upload permission test passed');
    
    // Clean up test file
    await supabase.storage.from('logo').remove([testPath]);
    console.log('🧹 Test file cleaned up');
    
    return { 
      success: true, 
      buckets: buckets?.map(b => b.name),
      logoBucket,
      filesCount: files?.length || 0
    };
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
};

export const checkImageUploadRequirements = () => {
  const requirements = [
    '1. Supabase bucket "logo" must exist',
    '2. Folder "organization" should be accessible in the bucket',
    '3. Upload permissions must be enabled for authenticated users',
    '4. Storage policies should allow INSERT and SELECT operations',
    '5. File size limits should accommodate compressed images (typically < 2MB)'
  ];
  
  console.log('📋 Image Upload Requirements:');
  requirements.forEach(req => console.log(`   ${req}`));
  
  return requirements;
};

// Helper to generate cryptographically secure random string for filenames
const generateRandomString = (length: number = 16): string => {
  // Use crypto.randomUUID() if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '').substring(0, length);
  }
  
  // Fallback to Math.random for older browsers
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Alternative UUID-based filename generator
const generateUUIDFilename = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback UUID generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper to generate the correct file path for organization logos with random filename
export const getOrganizationLogoPath = (orgId: number, originalFilename: string): string => {
  // Check if filename is valid to extract extension
  if (!originalFilename || typeof originalFilename !== 'string' || originalFilename.trim() === '') {
    console.error('Invalid filename provided:', originalFilename);
    throw new Error('Invalid filename provided');
  }
  
  const extension = originalFilename.split('.').pop()?.toLowerCase();
  
  // Check if extension exists
  if (!extension || extension.trim() === '') {
    console.error('No extension found in filename:', originalFilename);
    throw new Error('File must have a valid extension');
  }
  
  // Generate completely random filename using UUID
  const uuid = generateUUIDFilename();
  const randomFilename = `logo-${uuid}.${extension}`;
  
  console.log('Generated random logo filename:', randomFilename);
  console.log('Original filename was:', originalFilename);
  
  return `organization/${randomFilename}`;
};

// Alternative function for timestamp-based random names (if needed)
export const getOrganizationLogoPathWithTimestamp = (orgId: number, originalFilename: string): string => {
  const extension = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const randomString = generateRandomString(12);
  const filename = `org-${orgId}-${timestamp}-${randomString}.${extension}`;
  
  console.log('Generated timestamp-based random filename:', filename);
  return `organization/${filename}`;
};

// Helper to delete organization logo from storage
export const deleteOrganizationLogo = async (logoUrl: string): Promise<boolean> => {
  try {
    const supabase = createClient();
    
    // Extract file path from URL
    // Example URL: https://oxkuxwkehinhyxfsauqe.supabase.co/storage/v1/object/public/logo/organization/org-1-1234567890.jpg
    const urlParts = logoUrl.split('/storage/v1/object/public/logo/');
    if (urlParts.length < 2) {
      console.warn('Invalid logo URL format:', logoUrl);
      return false;
    }
    
    const filePath = urlParts[1];
    console.log('Attempting to delete logo file:', filePath);
    
    const { error } = await supabase.storage
      .from('logo')
      .remove([filePath]);
    
    if (error) {
      console.error('Error deleting old logo:', error);
      return false;
    }
    
    console.log('✅ Old logo deleted successfully:', filePath);
    return true;
  } catch (error) {
    console.error('💥 Unexpected error deleting logo:', error);
    return false;
  }
};

// Helper to get public URL for organization logo
export const getOrganizationLogoUrl = async (filePath: string): Promise<string | null> => {
  try {
    const supabase = createClient();
    const { data } = supabase.storage.from('logo').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    console.error('Error getting public URL:', error);
    return null;
  }
};