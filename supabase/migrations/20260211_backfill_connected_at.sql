-- =====================================================================
-- Migration: Backfill connected_at column
-- Created: 2026-02-11
-- Purpose: Populate connected_at for existing integrations using updated_at
-- =====================================================================

DO $$ 
BEGIN
    -- Update existing connected integrations that have null connected_at
    -- We use updated_at as a proxy for the connection time
    UPDATE integrations 
    SET connected_at = updated_at 
    WHERE connected = true 
    AND connected_at IS NULL;
    
    -- Log the result (optional, visible if running in some SQL clients)
    RAISE NOTICE 'Backfilled connected_at for existing integrations.';
END $$;
