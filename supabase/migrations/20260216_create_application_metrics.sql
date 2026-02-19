-- Migration: Create application_metrics table
-- Purpose: Track API usage, webhook events, and sync status for applications.
-- Equivalent to the old 'integration_metrics' but linked to 'applications' table.

CREATE TABLE IF NOT EXISTS application_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    
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
    
    -- Metrics date (Daily aggregation)
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One record per application per day
    CONSTRAINT unique_app_metrics_date UNIQUE (application_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_application_metrics_date ON application_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_application_metrics_org ON application_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_application_metrics_app ON application_metrics(application_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_application_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER application_metrics_updated_at
    BEFORE UPDATE ON application_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_application_metrics_updated_at();

-- Enable RLS
ALTER TABLE application_metrics ENABLE ROW LEVEL SECURITY;

-- Add RLS Policy
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'application_metrics' AND policyname = 'application_metrics_org_isolation'
    ) THEN
        CREATE POLICY application_metrics_org_isolation ON application_metrics
            FOR ALL
            USING (organization_id IN (
                SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
            ));
    END IF;
END
$$;

-- Helper Function: Increment Metric
CREATE OR REPLACE FUNCTION increment_application_metric(
    p_application_id INTEGER,
    p_organization_id INTEGER,
    p_metric_name TEXT,
    p_increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO application_metrics (
        application_id,
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
        p_application_id,
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
    ON CONFLICT (application_id, date)
    DO UPDATE SET
        api_calls_count = application_metrics.api_calls_count + 
            CASE WHEN p_metric_name = 'api_calls' THEN p_increment ELSE 0 END,
        webhooks_received_count = application_metrics.webhooks_received_count + 
            CASE WHEN p_metric_name = 'webhooks_received' THEN p_increment ELSE 0 END,
        webhooks_processed_count = application_metrics.webhooks_processed_count + 
            CASE WHEN p_metric_name = 'webhooks_processed' THEN p_increment ELSE 0 END,
        sync_count = application_metrics.sync_count + 
            CASE WHEN p_metric_name = 'sync' THEN p_increment ELSE 0 END,
        sync_success_count = application_metrics.sync_success_count + 
            CASE WHEN p_metric_name = 'sync_success' THEN p_increment ELSE 0 END,
        sync_failed_count = application_metrics.sync_failed_count + 
            CASE WHEN p_metric_name = 'sync_failed' THEN p_increment ELSE 0 END,
        error_count = application_metrics.error_count + 
            CASE WHEN p_metric_name = 'error' THEN p_increment ELSE 0 END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
