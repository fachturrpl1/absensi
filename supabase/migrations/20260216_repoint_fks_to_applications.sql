-- =====================================================================
-- Migration: Repoint Foreign Keys to applications table
-- Created: 2026-02-16
-- Purpose: Since we moved OAuth storage to 'applications', 
-- dependent tables must reference 'applications.id' instead of 'integrations.id'.
-- =====================================================================

-- 1. Update WEBHOOK_EVENTS
ALTER TABLE webhook_events
DROP CONSTRAINT IF EXISTS webhook_events_integration_id_fkey;

ALTER TABLE webhook_events
ADD CONSTRAINT webhook_events_integration_id_fkey
FOREIGN KEY (integration_id)
REFERENCES applications(id)
ON DELETE CASCADE;

-- 2. Update SYNC_LOGS
ALTER TABLE sync_logs
DROP CONSTRAINT IF EXISTS sync_logs_integration_id_fkey;

ALTER TABLE sync_logs
ADD CONSTRAINT sync_logs_integration_id_fkey
FOREIGN KEY (integration_id)
REFERENCES applications(id)
ON DELETE CASCADE;

-- 3. Update EXTERNAL_TASKS
ALTER TABLE external_tasks
DROP CONSTRAINT IF EXISTS external_tasks_integration_id_fkey;

ALTER TABLE external_tasks
ADD CONSTRAINT external_tasks_integration_id_fkey
FOREIGN KEY (integration_id)
REFERENCES applications(id)
ON DELETE CASCADE;

-- 4. Update Policies (Optional / Check if needed)
-- Existing policies use "integration_id IN (SELECT id FROM integrations...)"
-- These need to be updated to select from 'applications'.

DROP POLICY IF EXISTS sync_logs_org_isolation ON sync_logs;
CREATE POLICY sync_logs_org_isolation ON sync_logs
    FOR ALL
    USING (integration_id IN (
        SELECT id FROM applications WHERE organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    ));

DROP POLICY IF EXISTS webhook_events_org_isolation ON webhook_events;
CREATE POLICY webhook_events_org_isolation ON webhook_events
    FOR ALL
    USING (integration_id IN (
        SELECT id FROM applications WHERE organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    ));

-- Note: external_tasks policy already uses organization_id column directly, so it might be fine, 
-- but if it relies on integration_id, update it.
-- Checking original schema: "USING (organization_id IN ...)" -> It uses organization_id. Safe.
