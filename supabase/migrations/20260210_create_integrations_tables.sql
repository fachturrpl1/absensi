-- =====================================================================
-- Presensi Integration System - Database Schema
-- Created: 2026-02-10
-- Purpose: Tables for managing third-party integrations (Hubstaff-style)
-- =====================================================================

-- ───────────────────────────────────────────────────────────────────
-- 1. INTEGRATIONS TABLE
-- Stores connection data for each third-party integration
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN (
        'slack', 'microsoft-teams', 'zoom',
        'asana', 'jira', 'trello', 'clickup', 'github', 'gitlab',
        'quickbooks', 'xero', 'freshbooks',
        'salesforce', 'zoho-crm',
        'paypal', 'wise',
        'google-calendar', 'notion'
    )),
    display_name TEXT NOT NULL,
    connected BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'ACTIVE', 'ERROR', 'SYNCING', 'DISCONNECTED'
    )),
    
    -- OAuth tokens (encrypted at application layer)
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    
    -- Provider-specific configuration
    config JSONB DEFAULT '{}'::jsonb,
    permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Webhook configuration
    webhook_url TEXT,
    webhook_secret TEXT, -- For signature verification
    
    -- Sync management
    last_sync_at TIMESTAMPTZ,
    sync_enabled BOOLEAN DEFAULT true,
    sync_frequency TEXT DEFAULT '15min' CHECK (sync_frequency IN (
        '5min', '15min', '30min', '1hr', '6hr', '12hr', '24hr', 'manual'
    )),
    
    -- Error tracking
    error_message TEXT,
    error_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one integration per provider per organization
    CONSTRAINT unique_org_provider UNIQUE (organization_id, provider)
);

-- Indexes for performance
CREATE INDEX idx_integrations_org ON integrations(organization_id);
CREATE INDEX idx_integrations_status ON integrations(status);
CREATE INDEX idx_integrations_provider ON integrations(provider);
CREATE INDEX idx_integrations_sync_enabled ON integrations(sync_enabled) WHERE sync_enabled = true;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_integrations_updated_at();

-- ───────────────────────────────────────────────────────────────────
-- 2. SYNC_LOGS TABLE
-- Tracks sync history and status for each integration
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    
    status TEXT DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED'
    )),
    
    direction TEXT NOT NULL CHECK (direction IN (
        'INBOUND', 'OUTBOUND', 'BIDIRECTIONAL'
    )),
    
    -- Sync metrics
    records_count INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    
    -- Error tracking
    error_message TEXT,
    error_details JSONB,
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000
    ) STORED,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sync_logs_integration ON sync_logs(integration_id);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
CREATE INDEX idx_sync_logs_started ON sync_logs(started_at DESC);
CREATE INDEX idx_sync_logs_integration_started ON sync_logs(integration_id, started_at DESC);

-- ───────────────────────────────────────────────────────────────────
-- 3. WEBHOOK_EVENTS TABLE
-- Stores incoming webhook events for async processing
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    
    -- Processing status
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    
    -- Error tracking
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Headers for debugging
    headers JSONB,
    
    -- Timestamps
    received_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_webhook_events_integration ON webhook_events(integration_id);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed, received_at);
CREATE INDEX idx_webhook_events_pending ON webhook_events(received_at) WHERE processed = false;
CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);

-- ───────────────────────────────────────────────────────────────────
-- 4. INTEGRATION_METRICS TABLE
-- Daily aggregated metrics for monitoring integration health
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS integration_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Metric counters
    api_calls_count INTEGER DEFAULT 0,
    webhooks_received_count INTEGER DEFAULT 0,
    webhooks_processed_count INTEGER DEFAULT 0,
    sync_count INTEGER DEFAULT 0,
    sync_success_count INTEGER DEFAULT 0,
    sync_failed_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    
    -- Rate limit tracking
    rate_limit_hits INTEGER DEFAULT 0,
    
    -- Metrics date
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One record per provider per org per day
    CONSTRAINT unique_metrics_date UNIQUE (provider, organization_id, date)
);

-- Indexes
CREATE INDEX idx_integration_metrics_date ON integration_metrics(date DESC);
CREATE INDEX idx_integration_metrics_org ON integration_metrics(organization_id);
CREATE INDEX idx_integration_metrics_provider ON integration_metrics(provider);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_integration_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER integration_metrics_updated_at
    BEFORE UPDATE ON integration_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_integration_metrics_updated_at();

-- ───────────────────────────────────────────────────────────────────
-- 5. EXTERNAL_TASKS TABLE
-- Stores tasks imported from external project management tools
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS external_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- External task identifiers
    external_id TEXT NOT NULL, -- ID in the external system
    external_url TEXT,
    
    -- Task details
    title TEXT NOT NULL,
    description TEXT,
    status TEXT,
    priority TEXT,
    
    -- Assignment
    assignee_external_id TEXT,
    assignee_member_id TEXT, -- REFERENCES organization_members(id) ON DELETE SET NULL, -- Type uncertain, FK disabled for safety
    
    -- Project/board association
    project_external_id TEXT,
    project_id TEXT, -- REFERENCES projects(id) ON DELETE SET NULL, -- Table might not exist, FK disabled for safety
    
    -- Dates
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Sync metadata
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    raw_data JSONB, -- Full task data from provider
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one task per external ID per integration
    CONSTRAINT unique_external_task UNIQUE (integration_id, external_id)
);

-- Indexes
CREATE INDEX idx_external_tasks_integration ON external_tasks(integration_id);
CREATE INDEX idx_external_tasks_org ON external_tasks(organization_id);
CREATE INDEX idx_external_tasks_assignee ON external_tasks(assignee_member_id);
CREATE INDEX idx_external_tasks_project ON external_tasks(project_id);
CREATE INDEX idx_external_tasks_status ON external_tasks(status);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_external_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER external_tasks_updated_at
    BEFORE UPDATE ON external_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_external_tasks_updated_at();

-- ───────────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- Ensure users can only access integrations for their organization
-- ───────────────────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_tasks ENABLE ROW LEVEL SECURITY;

-- Integrations policies
CREATE POLICY integrations_org_isolation ON integrations
    FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));

-- Sync logs policies
CREATE POLICY sync_logs_org_isolation ON sync_logs
    FOR ALL
    USING (integration_id IN (
        SELECT id FROM integrations WHERE organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    ));

-- Webhook events policies
CREATE POLICY webhook_events_org_isolation ON webhook_events
    FOR ALL
    USING (integration_id IN (
        SELECT id FROM integrations WHERE organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    ));

-- Integration metrics policies
CREATE POLICY integration_metrics_org_isolation ON integration_metrics
    FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));

-- External tasks policies
CREATE POLICY external_tasks_org_isolation ON external_tasks
    FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));

-- ───────────────────────────────────────────────────────────────────
-- 7. HELPER FUNCTIONS
-- Utility functions for integration management
-- ───────────────────────────────────────────────────────────────────

-- Function to increment metric counters
CREATE OR REPLACE FUNCTION increment_integration_metric(
    p_provider TEXT,
    p_organization_id INTEGER,
    p_metric_name TEXT,
    p_increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO integration_metrics (
        provider,
        organization_id,
        date,
        api_calls_count,
        webhooks_received_count,
        webhooks_processed_count,
        sync_count,
        sync_success_count,
        sync_failed_count,
        error_count
    )
    VALUES (
        p_provider,
        p_organization_id,
        CURRENT_DATE,
        CASE WHEN p_metric_name = 'api_calls' THEN p_increment ELSE 0 END,
        CASE WHEN p_metric_name = 'webhooks_received' THEN p_increment ELSE 0 END,
        CASE WHEN p_metric_name = 'webhooks_processed' THEN p_increment ELSE 0 END,
        CASE WHEN p_metric_name = 'sync' THEN p_increment ELSE 0 END,
        CASE WHEN p_metric_name = 'sync_success' THEN p_increment ELSE 0 END,
        CASE WHEN p_metric_name = 'sync_failed' THEN p_increment ELSE 0 END,
        CASE WHEN p_metric_name = 'error' THEN p_increment ELSE 0 END
    )
    ON CONFLICT (provider, organization_id, date)
    DO UPDATE SET
        api_calls_count = integration_metrics.api_calls_count + 
            CASE WHEN p_metric_name = 'api_calls' THEN p_increment ELSE 0 END,
        webhooks_received_count = integration_metrics.webhooks_received_count + 
            CASE WHEN p_metric_name = 'webhooks_received' THEN p_increment ELSE 0 END,
        webhooks_processed_count = integration_metrics.webhooks_processed_count + 
            CASE WHEN p_metric_name = 'webhooks_processed' THEN p_increment ELSE 0 END,
        sync_count = integration_metrics.sync_count + 
            CASE WHEN p_metric_name = 'sync' THEN p_increment ELSE 0 END,
        sync_success_count = integration_metrics.sync_success_count + 
            CASE WHEN p_metric_name = 'sync_success' THEN p_increment ELSE 0 END,
        sync_failed_count = integration_metrics.sync_failed_count + 
            CASE WHEN p_metric_name = 'sync_failed' THEN p_increment ELSE 0 END,
        error_count = integration_metrics.error_count + 
            CASE WHEN p_metric_name = 'error' THEN p_increment ELSE 0 END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- END OF MIGRATION
-- =====================================================================
