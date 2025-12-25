-- Migration: Add email column to organization_members table
-- Purpose: Support import members with email without creating user account

-- Add email column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organization_members' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE organization_members 
    ADD COLUMN email CHARACTER VARYING(255) NULL;
    
    RAISE NOTICE 'Added email column to organization_members';
  ELSE
    RAISE NOTICE 'Email column already exists in organization_members';
  END IF;
END $$;

-- Add email format validation constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'organization_members_email_format_check'
  ) THEN
    ALTER TABLE organization_members 
    ADD CONSTRAINT organization_members_email_format_check 
    CHECK (
      email IS NULL OR 
      email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    );
    
    RAISE NOTICE 'Added email format validation constraint';
  ELSE
    RAISE NOTICE 'Email format constraint already exists';
  END IF;
END $$;

-- Add unique constraint for email per organization (DEFERRABLE untuk allow NULL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'organization_members_organization_id_email_key'
  ) THEN
    ALTER TABLE organization_members 
    ADD CONSTRAINT organization_members_organization_id_email_key 
    UNIQUE (organization_id, email) 
    DEFERRABLE INITIALLY DEFERRED;
    
    RAISE NOTICE 'Added unique email constraint per organization';
  ELSE
    RAISE NOTICE 'Email unique constraint already exists';
  END IF;
END $$;

-- Create index for email searches
CREATE INDEX IF NOT EXISTS idx_org_members_email 
  ON organization_members(email) 
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_org_members_email_org 
  ON organization_members(organization_id, email) 
  WHERE email IS NOT NULL;

-- Add comment
COMMENT ON COLUMN organization_members.email IS 
'Email address member. Bisa diisi langsung saat import tanpa perlu membuat user account.';

-- Optional: Migrate existing emails from user_profiles (if needed)
-- UPDATE organization_members om
-- SET email = up.email
-- FROM user_profiles up
-- WHERE om.user_id = up.id 
--   AND om.email IS NULL 
--   AND up.email IS NOT NULL;


