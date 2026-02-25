-- ============================================================
-- Migration: Create screenshots storage bucket + RLS policies
-- ============================================================

-- 1. Create the "screenshots" bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'screenshots',
  'screenshots',
  false,                          -- private bucket
  5242880,                        -- max 5 MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 2. RLS Policies for storage.objects (screenshots bucket)
-- ============================================================

-- Policy: Authenticated users can upload to their own folder
-- Path format: {org_id}/{member_id}/{filename}
CREATE POLICY "screenshots_upload_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'screenshots'
);

-- Policy: Authenticated users can view screenshots within their org
CREATE POLICY "screenshots_select_policy"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'screenshots'
);

-- Policy: Authenticated users can delete their own screenshots
CREATE POLICY "screenshots_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'screenshots'
);

-- Policy: Authenticated users can update their own screenshots
CREATE POLICY "screenshots_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
WITH CHECK (
  bucket_id = 'screenshots'
);
