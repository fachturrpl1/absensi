-- Migration: Make applications table columns nullable for OAuth support
-- Purpose: The 'applications' table was originally created with NOT NULL constraints on 
--          api_key, api_secret, developer, and email, which are not always applicable 
--          for OAuth integrations (Github, Slack, etc.) that use different auth mechanisms.

ALTER TABLE applications 
    ALTER COLUMN api_key DROP NOT NULL,
    ALTER COLUMN api_secret DROP NOT NULL,
    ALTER COLUMN developer DROP NOT NULL,
    ALTER COLUMN email DROP NOT NULL,
    ALTER COLUMN name DROP NOT NULL; -- Optional, but good for flexibility

-- Ensure developer and email columns exist (if table was created differently)
-- This part is redundant if the table follows 20260216_add_attendance_backup_tables.sql
-- but harmless to include checks if we wanted to be extremely safe.
-- However, ALTER COLUMN ... DROP NOT NULL requires the column to exist.

-- If you are unsure if the columns exist, you can wrap in DO block, 
-- but straightforward ALTER is usually better for migrations that assume a specific previous state.
