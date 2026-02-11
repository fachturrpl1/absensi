-- =====================================================================
-- Migration: Add connected_at column to integrations table
-- Created: 2026-02-11
-- Purpose: Track when an integration was last successfully connected
-- =====================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'integrations' 
        AND column_name = 'connected_at'
    ) THEN
        ALTER TABLE integrations 
        ADD COLUMN connected_at TIMESTAMPTZ;
        
        COMMENT ON COLUMN integrations.connected_at IS 'Timestamp when the integration was last connected';
    END IF;
END $$;
