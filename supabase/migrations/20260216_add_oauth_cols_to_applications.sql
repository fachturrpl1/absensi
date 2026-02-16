-- =====================================================================
-- Migration: Add OAuth columns to applications table
-- Created: 2026-02-16
-- Purpose: Support OAuth integrations in the 'applications' table
-- =====================================================================

-- Add columns to support OAuth data
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS provider TEXT CHECK (provider IN (
    'slack', 'microsoft-teams', 'zoom',
    'asana', 'jira', 'trello', 'clickup', 'github', 'gitlab',
    'quickbooks', 'xero', 'freshbooks',
    'salesforce', 'zoho-crm',
    'paypal', 'wise',
    'google-calendar', 'notion'
)),
ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS access_token TEXT,
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS webhook_url TEXT,
ADD COLUMN IF NOT EXISTS webhook_secret TEXT,
ADD COLUMN IF NOT EXISTS connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'IDLE',
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS error_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_applications_org ON applications(organization_id);
CREATE INDEX IF NOT EXISTS idx_applications_provider ON applications(provider);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- Enable RLS (if not already enabled)
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for organization isolation (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'applications' AND policyname = 'applications_org_isolation'
    ) THEN
        CREATE POLICY applications_org_isolation ON applications
            FOR ALL
            USING (organization_id IN (
                SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
            ));
    END IF;
END
$$;
