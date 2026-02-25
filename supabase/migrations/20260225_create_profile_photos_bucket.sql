-- ============================================================
-- Migration: Create profile-photos storage bucket + RLS policies
-- ============================================================

-- 1. Create the "profile-photos" bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,                           -- public bucket so photos are accessible via URL
  8388608,                        -- max 8 MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 2. RLS Policies for storage.objects (profile-photos bucket)
-- ============================================================

-- Policy: Anyone can view profile photos (since it's a public bucket)
CREATE POLICY "profile_photos_public_select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-photos');

-- Policy: Authenticated users can upload to their own folder
-- Path format: users/{user_id}/{filename}
CREATE POLICY "profile_photos_upload_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = 'users' AND
  (storage.foldername(name))[2] = (auth.uid())::text
);

-- Policy: Authenticated users can update their own profile photos
CREATE POLICY "profile_photos_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = 'users' AND
  (storage.foldername(name))[2] = (auth.uid())::text
);

-- Policy: Authenticated users can delete their own profile photos
CREATE POLICY "profile_photos_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos' AND
  (storage.foldername(name))[1] = 'users' AND
  (storage.foldername(name))[2] = (auth.uid())::text
);
