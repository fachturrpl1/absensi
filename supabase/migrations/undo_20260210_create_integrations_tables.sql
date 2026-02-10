-- =====================================================================
-- UNDO Presensi Integration System - Drop Tables
-- Created: 2026-02-10
-- Purpose: Remove all tables and functions related to integrations
-- =====================================================================

-- 1. DROP POLICY (Though DROP TABLE CASCADE handles this, good to be explicit for understanding)
-- (Skipped for brevity, using CASCADE)

-- 2. DROP TABLES (Reverse dependency order)

-- Drop dependents of integrations first
DROP TABLE IF EXISTS external_tasks CASCADE;
DROP TABLE IF EXISTS sync_logs CASCADE;
DROP TABLE IF EXISTS webhook_events CASCADE;
DROP TABLE IF EXISTS integration_metrics CASCADE;

-- Drop main integrations table
DROP TABLE IF EXISTS integrations CASCADE;

-- 3. DROP FUNCTIONS & TRIGGERS

-- Triggers are dropped when their table is dropped, so we just drop functions.

DROP FUNCTION IF EXISTS update_external_tasks_updated_at();
DROP FUNCTION IF EXISTS update_integration_metrics_updated_at();
DROP FUNCTION IF EXISTS update_integrations_updated_at();
DROP FUNCTION IF EXISTS increment_integration_metric(TEXT, INTEGER, TEXT, INTEGER);

-- =====================================================================
-- END OF UNDO SCRIPT
-- =====================================================================
