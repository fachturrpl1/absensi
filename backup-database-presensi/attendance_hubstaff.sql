-- =============================================
-- HUBSTAFF++ FEATURE EXTENSION FOR ATTENDANCE SYSTEM
-- Version: 1.0
-- Extension for attendance.sql
-- Adds: Activity Tracking, Screenshots, Projects, 
--       Time Off Policies, Timesheets, Smart Notifications, etc.
-- =============================================

-- =============================================
-- 1. PROJECT & TASK MANAGEMENT
-- =============================================

-- Projects Table (untuk time tracking per project)
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    project_type VARCHAR(50) DEFAULT 'project',
    is_billable BOOLEAN DEFAULT true,
    color_code VARCHAR(7),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(organization_id, code),
    CONSTRAINT chk_project_status CHECK (status IN ('active', 'archived', 'deleted')),
    CONSTRAINT chk_project_type CHECK (project_type IN ('project', 'work_order', 'work_break'))
);

-- Tasks Table (sub-items dalam project)
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    summary VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    priority INT DEFAULT 0,
    estimated_hours DECIMAL(8,2),
    metadata JSONB,
    lock_version INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_task_status CHECK (status IN ('active', 'completed'))
);

-- Task Assignments (Many-to-Many: Tasks <-> Members)
CREATE TABLE task_assignments (
    id SERIAL PRIMARY KEY,
    task_id INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    organization_member_id INT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES user_profiles(id),
    UNIQUE(task_id, organization_member_id)
);

-- Project Members (akses user ke project)
CREATE TABLE project_members (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    organization_member_id INT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'user',
    pay_rate DECIMAL(10,2),
    bill_rate DECIMAL(10,2),
    currency_code CHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, organization_member_id),
    CONSTRAINT chk_project_member_role CHECK (role IN ('viewer', 'user', 'manager'))
);

-- =============================================
-- 2. TEAMS (Hubstaff-style groups)
-- =============================================

-- Teams Table
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    lead_options JSONB DEFAULT '{
        "approve_timesheets": true,
        "approve_time_off": true,
        "approve_manual_time": true,
        "schedule_shifts": true,
        "manage_team_projects": true,
        "manage_team_members": true,
        "view_screenshots": true
    }'::jsonb,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, name)
);

-- Team Members
CREATE TABLE team_members (
    id SERIAL PRIMARY KEY,
    team_id INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    organization_member_id INT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'user',
    is_lead BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, organization_member_id),
    CONSTRAINT chk_team_member_role CHECK (role IN ('viewer', 'user', 'manager'))
);

-- Team Projects (Projects associated with Teams)
CREATE TABLE team_projects (
    team_id INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, project_id)
);

-- =============================================
-- 3. TIME TRACKING & ACTIVITIES
-- =============================================

-- Timesheets (weekly approval) - Created first for FK reference
CREATE TABLE timesheets (
    id SERIAL PRIMARY KEY,
    organization_member_id INT NOT NULL REFERENCES organization_members(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES user_profiles(id),
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejected_by UUID REFERENCES user_profiles(id),
    rejection_reason TEXT,
    total_tracked_seconds INT DEFAULT 0,
    total_manual_seconds INT DEFAULT 0,
    total_billable_seconds INT DEFAULT 0,
    total_paid_seconds INT DEFAULT 0,
    is_paid BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_member_id, start_date, end_date),
    CONSTRAINT chk_timesheet_status CHECK (status IN ('open', 'submitted', 'approved', 'rejected')),
    CONSTRAINT chk_timesheet_dates CHECK (end_date >= start_date)
);

-- Time Entries (manual atau tracked per project/task)
CREATE TABLE time_entries (
    id SERIAL PRIMARY KEY,
    organization_member_id INT NOT NULL REFERENCES organization_members(id),
    project_id INT REFERENCES projects(id),
    task_id INT REFERENCES tasks(id),
    timesheet_id INT REFERENCES timesheets(id),
    entry_date DATE NOT NULL,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    stops_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INT,
    time_type VARCHAR(50) DEFAULT 'tracked',
    is_billable BOOLEAN DEFAULT true,
    is_paid BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    source VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_time_entry_type CHECK (time_type IN ('tracked', 'manual', 'idle', 'break')),
    CONSTRAINT chk_time_entry_source CHECK (source IS NULL OR source IN ('desktop_app', 'mobile_app', 'web', 'api'))
);

-- Activities (Hubstaff-style activity tracking per time slot)
CREATE TABLE activities (
    id BIGSERIAL PRIMARY KEY,
    organization_member_id INT NOT NULL REFERENCES organization_members(id),
    project_id INT REFERENCES projects(id),
    task_id INT REFERENCES tasks(id),
    timesheet_id INT REFERENCES timesheets(id),
    time_slot TIMESTAMP WITH TIME ZONE NOT NULL,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    activity_date DATE NOT NULL,
    tracked_seconds INT DEFAULT 0,
    keyboard_seconds INT DEFAULT 0,
    mouse_seconds INT DEFAULT 0,
    overall_seconds INT DEFAULT 0,
    input_tracked_seconds INT DEFAULT 0,
    is_billable BOOLEAN DEFAULT true,
    is_paid BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    tracks_input BOOLEAN DEFAULT true,
    client_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_activity_client CHECK (client_type IS NULL OR client_type IN ('desktop', 'mobile', 'web'))
);

-- Idle Time Records
CREATE TABLE idle_time_records (
    id BIGSERIAL PRIMARY KEY,
    organization_member_id INT NOT NULL REFERENCES organization_members(id),
    project_id INT REFERENCES projects(id),
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INT,
    idle_type VARCHAR(50),
    is_billable BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_idle_type CHECK (idle_type IS NULL OR idle_type IN ('system_idle', 'no_input', 'break', 'away'))
);

-- Time Edit Logs (audit trail)
CREATE TABLE time_edit_logs (
    id SERIAL PRIMARY KEY,
    time_entry_id INT REFERENCES time_entries(id) ON DELETE SET NULL,
    activity_id BIGINT REFERENCES activities(id) ON DELETE SET NULL,
    edited_by UUID NOT NULL REFERENCES user_profiles(id),
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    action VARCHAR(50) NOT NULL,
    original_starts_at TIMESTAMP WITH TIME ZONE,
    original_stops_at TIMESTAMP WITH TIME ZONE,
    new_starts_at TIMESTAMP WITH TIME ZONE,
    new_stops_at TIMESTAMP WITH TIME ZONE,
    original_project_id INT,
    new_project_id INT,
    original_task_id INT,
    new_task_id INT,
    added_duration_seconds INT DEFAULT 0,
    deleted_duration_seconds INT DEFAULT 0,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_time_edit_action CHECK (action IN ('create', 'update', 'delete', 'split', 'merge'))
);

-- =============================================
-- 4. SCREENSHOTS
-- =============================================

-- Screenshots Table
CREATE TABLE screenshots (
    id BIGSERIAL PRIMARY KEY,
    organization_member_id INT NOT NULL REFERENCES organization_members(id),
    project_id INT REFERENCES projects(id),
    task_id INT REFERENCES tasks(id),
    activity_id BIGINT REFERENCES activities(id),
    screenshot_date DATE NOT NULL,
    time_slot TIMESTAMP WITH TIME ZONE NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    full_url VARCHAR(500) NOT NULL,
    thumb_url VARCHAR(500),
    screen_number INT DEFAULT 1,
    width INT,
    height INT,
    offset_x INT DEFAULT 0,
    offset_y INT DEFAULT 0,
    is_blurred BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Screenshot Settings per Organization/Member
CREATE TABLE screenshot_settings (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    organization_member_id INT REFERENCES organization_members(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    frequency_seconds INT DEFAULT 600,
    blur_screenshots BOOLEAN DEFAULT false,
    allow_delete BOOLEAN DEFAULT false,
    retention_days INT DEFAULT 90,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, organization_member_id)
);

-- =============================================
-- 5. TOOL/APP USAGE TRACKING
-- =============================================

-- Tool/App Usage Tracking
CREATE TABLE tool_usages (
    id BIGSERIAL PRIMARY KEY,
    organization_member_id INT NOT NULL REFERENCES organization_members(id),
    project_id INT REFERENCES projects(id),
    usage_date DATE NOT NULL,
    tool_name VARCHAR(255) NOT NULL,
    tool_type VARCHAR(50),
    tracked_seconds INT DEFAULT 0,
    activations INT DEFAULT 0,
    category VARCHAR(100),
    is_productive BOOLEAN,
    productivity_score INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_member_id, usage_date, tool_name, tool_type),
    CONSTRAINT chk_tool_type CHECK (tool_type IS NULL OR tool_type IN ('application', 'website', 'browser')),
    CONSTRAINT chk_productivity_score CHECK (productivity_score IS NULL OR (productivity_score >= -100 AND productivity_score <= 100))
);

-- URL Visit Tracking
CREATE TABLE url_visits (
    id BIGSERIAL PRIMARY KEY,
    organization_member_id INT NOT NULL REFERENCES organization_members(id),
    project_id INT REFERENCES projects(id),
    visit_date DATE NOT NULL,
    url TEXT NOT NULL,
    domain VARCHAR(255),
    title VARCHAR(500),
    tracked_seconds INT DEFAULT 0,
    visit_count INT DEFAULT 1,
    category VARCHAR(100),
    is_productive BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Productivity Categories
CREATE TABLE productivity_categories (
    id SERIAL PRIMARY KEY,
    organization_id INT REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    match_type VARCHAR(50) NOT NULL,
    match_pattern VARCHAR(255) NOT NULL,
    productivity_score INT DEFAULT 0,
    is_core BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_match_type CHECK (match_type IN ('app_name', 'domain', 'url_pattern')),
    CONSTRAINT chk_category_score CHECK (productivity_score >= -100 AND productivity_score <= 100)
);

-- =============================================
-- 6. JOB SITES (GPS TRACKING)
-- =============================================

-- Job Sites
CREATE TABLE job_sites (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius_meters INT DEFAULT 100,
    rules JSONB DEFAULT '{
        "enter_action": "notify",
        "exit_action": "notify",
        "auto_track_project_id": null
    }'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_radius CHECK (radius_meters >= 50 AND radius_meters <= 5000)
);

-- Job Site Visits
CREATE TABLE job_site_visits (
    id BIGSERIAL PRIMARY KEY,
    job_site_id INT NOT NULL REFERENCES job_sites(id) ON DELETE CASCADE,
    organization_member_id INT NOT NULL REFERENCES organization_members(id),
    status VARCHAR(50) DEFAULT 'active',
    enter_at TIMESTAMP WITH TIME ZONE NOT NULL,
    exit_at TIMESTAMP WITH TIME ZONE,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_visit_status CHECK (status IN ('active', 'completed'))
);

-- Location Logs
CREATE TABLE location_logs (
    id BIGSERIAL PRIMARY KEY,
    organization_member_id INT NOT NULL REFERENCES organization_members(id),
    time_entry_id INT REFERENCES time_entries(id),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy_meters DECIMAL(10, 2),
    captured_at TIMESTAMP WITH TIME ZONE NOT NULL,
    source VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_location_source CHECK (source IS NULL OR source IN ('gps', 'wifi', 'cell_tower', 'ip'))
);

-- =============================================
-- 7. ENHANCED TIME OFF
-- =============================================

-- Time Off Policies
CREATE TABLE time_off_policies (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    policy_type VARCHAR(50),
    accrual_type VARCHAR(50),
    hours_per_year DECIMAL(8,2),
    hours_per_month DECIMAL(8,2),
    hours_per_hours_worked DECIMAL(8,4),
    maximum_accrual_hours DECIMAL(8,2),
    auto_add_new_members BOOLEAN DEFAULT false,
    allow_negative_balance BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT true,
    balance_rolls_over_annually BOOLEAN DEFAULT true,
    is_paid BOOLEAN DEFAULT true,
    prorate_on_start BOOLEAN DEFAULT true,
    accrual_day VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_policy_type CHECK (policy_type IS NULL OR policy_type IN ('vacation', 'sick', 'personal', 'unlimited', 'custom')),
    CONSTRAINT chk_accrual_type CHECK (accrual_type IS NULL OR accrual_type IN ('per_year', 'per_month', 'per_hours_worked', 'unlimited'))
);

-- Time Off Policy Members
CREATE TABLE time_off_policy_members (
    id SERIAL PRIMARY KEY,
    time_off_policy_id INT NOT NULL REFERENCES time_off_policies(id) ON DELETE CASCADE,
    organization_member_id INT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    accrued_hours DECIMAL(8,2) DEFAULT 0,
    used_hours DECIMAL(8,2) DEFAULT 0,
    enrollment_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(time_off_policy_id, organization_member_id)
);

-- Time Off Requests (Hubstaff-style)
CREATE TABLE time_off_requests_hs (
    id SERIAL PRIMARY KEY,
    organization_member_id INT NOT NULL REFERENCES organization_members(id),
    time_off_policy_id INT NOT NULL REFERENCES time_off_policies(id),
    status VARCHAR(50) DEFAULT 'pending',
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    stops_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_all_day BOOLEAN DEFAULT true,
    total_hours DECIMAL(8,2) NOT NULL,
    message TEXT,
    response TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES user_profiles(id),
    created_by UUID REFERENCES user_profiles(id),
    is_paid BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_time_off_status CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    CONSTRAINT chk_time_off_dates CHECK (stops_at >= starts_at)
);

-- =============================================
-- 8. SMART NOTIFICATIONS & UNUSUAL ACTIVITY
-- =============================================

-- Smart Notification Rules
CREATE TABLE smart_notification_rules (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    condition VARCHAR(50) NOT NULL,
    condition_value DECIMAL(12,2) NOT NULL,
    time_unit VARCHAR(50),
    target_all_members BOOLEAN DEFAULT false,
    target_team_ids INT[],
    target_user_ids UUID[],
    recipient_roles VARCHAR(50)[],
    recipient_user_ids UUID[],
    deliver_by VARCHAR(50)[] DEFAULT ARRAY['email'],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_snr_frequency CHECK (frequency IN ('hourly', 'daily', 'weekly', 'monthly')),
    CONSTRAINT chk_snr_metric CHECK (metric_type IN (
        'work_time', 'core_time', 'non_core_time', 'unproductive_time',
        'activity', 'suspicious_activity', 'unusual_activity',
        'time_spent_in_tool', 'idle_time', 'idle_time_percent',
        'manual_time', 'manual_time_percent'
    )),
    CONSTRAINT chk_snr_condition CHECK (condition IN ('above', 'below'))
);

-- Smart Notifications
CREATE TABLE smart_notifications (
    id SERIAL PRIMARY KEY,
    rule_id INT NOT NULL REFERENCES smart_notification_rules(id) ON DELETE CASCADE,
    from_date TIMESTAMP WITH TIME ZONE NOT NULL,
    to_date TIMESTAMP WITH TIME ZONE NOT NULL,
    matches JSONB NOT NULL,
    total_matches INT DEFAULT 0,
    rule_snapshot JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Unusual Activities
CREATE TABLE unusual_activities (
    id BIGSERIAL PRIMARY KEY,
    organization_member_id INT NOT NULL REFERENCES organization_members(id),
    activity_date DATE NOT NULL,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    unusual_type VARCHAR(100) NOT NULL,
    confidence_level VARCHAR(50),
    keyboard_seconds INT DEFAULT 0,
    mouse_seconds INT DEFAULT 0,
    tracked_seconds INT DEFAULT 0,
    overall_seconds INT DEFAULT 0,
    screenshot_ids BIGINT[],
    suspicious_apps TEXT[],
    top_urls TEXT[],
    is_reviewed BOOLEAN DEFAULT false,
    reviewed_by UUID REFERENCES user_profiles(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_action VARCHAR(50),
    review_notes TEXT,
    url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_ua_confidence CHECK (confidence_level IS NULL OR confidence_level IN ('low', 'medium', 'high')),
    CONSTRAINT chk_ua_review_action CHECK (review_action IS NULL OR review_action IN ('dismissed', 'flagged', 'investigated'))
);

-- =============================================
-- 9. WORK BREAKS
-- =============================================

-- Work Break Types
CREATE TABLE work_break_types (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_seconds INT,
    is_paid BOOLEAN DEFAULT false,
    is_billable BOOLEAN DEFAULT false,
    is_trackable BOOLEAN DEFAULT true,
    project_id INT REFERENCES projects(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Work Breaks
CREATE TABLE work_breaks (
    id SERIAL PRIMARY KEY,
    organization_member_id INT NOT NULL REFERENCES organization_members(id),
    work_break_type_id INT REFERENCES work_break_types(id),
    break_date DATE NOT NULL,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_break_status CHECK (status IN ('active', 'completed', 'exceeded'))
);

-- =============================================
-- 10. MEMBER LIMITS
-- =============================================

-- Member Limits
CREATE TABLE member_limits (
    id SERIAL PRIMARY KEY,
    organization_member_id INT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    daily_limit_hours DECIMAL(5,2),
    weekly_limit_hours DECIMAL(5,2),
    expected_per_week_hours DECIMAL(5,2),
    limits_by_shifts BOOLEAN DEFAULT false,
    allowed_days VARCHAR(3)[],
    expected_days VARCHAR(3)[],
    current_daily_override_hours DECIMAL(5,2),
    current_weekly_override_hours DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_member_id)
);

-- =============================================
-- 11. INDEXES FOR PERFORMANCE
-- =============================================

-- Activities
CREATE INDEX idx_activities_member_date ON activities(organization_member_id, activity_date);
CREATE INDEX idx_activities_project ON activities(project_id);
CREATE INDEX idx_activities_time_slot ON activities(time_slot);
CREATE INDEX idx_activities_timesheet ON activities(timesheet_id);

-- Screenshots
CREATE INDEX idx_screenshots_member_date ON screenshots(organization_member_id, screenshot_date);
CREATE INDEX idx_screenshots_recorded_at ON screenshots(recorded_at);
CREATE INDEX idx_screenshots_activity ON screenshots(activity_id);

-- Time Entries
CREATE INDEX idx_time_entries_member_date ON time_entries(organization_member_id, entry_date);
CREATE INDEX idx_time_entries_project ON time_entries(project_id);
CREATE INDEX idx_time_entries_timesheet ON time_entries(timesheet_id);

-- Tool Usages
CREATE INDEX idx_tool_usages_member_date ON tool_usages(organization_member_id, usage_date);
CREATE INDEX idx_tool_usages_tool_name ON tool_usages(tool_name);

-- URL Visits
CREATE INDEX idx_url_visits_member_date ON url_visits(organization_member_id, visit_date);
CREATE INDEX idx_url_visits_domain ON url_visits(domain);

-- Location Logs
CREATE INDEX idx_location_logs_member_time ON location_logs(organization_member_id, captured_at);

-- Job Site Visits
CREATE INDEX idx_job_site_visits_site ON job_site_visits(job_site_id);
CREATE INDEX idx_job_site_visits_member ON job_site_visits(organization_member_id);

-- Timesheets
CREATE INDEX idx_timesheets_member ON timesheets(organization_member_id);
CREATE INDEX idx_timesheets_dates ON timesheets(start_date, end_date);
CREATE INDEX idx_timesheets_status ON timesheets(status);

-- Unusual Activities
CREATE INDEX idx_unusual_activities_member ON unusual_activities(organization_member_id);
CREATE INDEX idx_unusual_activities_date ON unusual_activities(activity_date);

-- Projects & Tasks
CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);

-- Teams
CREATE INDEX idx_teams_org ON teams(organization_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_member ON team_members(organization_member_id);

-- Time Off
CREATE INDEX idx_time_off_policies_org ON time_off_policies(organization_id);
CREATE INDEX idx_time_off_requests_member ON time_off_requests_hs(organization_member_id);
CREATE INDEX idx_time_off_requests_status ON time_off_requests_hs(status);

-- Smart Notifications
CREATE INDEX idx_smart_notification_rules_org ON smart_notification_rules(organization_id);
CREATE INDEX idx_smart_notifications_rule ON smart_notifications(rule_id);

-- =============================================
-- 12. TRIGGERS FOR UPDATED_AT
-- =============================================

-- Apply updated_at trigger to new tables
DO $$ 
DECLARE 
    t text;
BEGIN 
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
        AND table_name IN (
            'projects', 'tasks', 'project_members', 'teams', 'team_members',
            'timesheets', 'time_entries', 'activities', 'screenshots', 'screenshot_settings',
            'tool_usages', 'url_visits', 'productivity_categories', 'job_sites', 'job_site_visits',
            'time_off_policies', 'time_off_policy_members', 'time_off_requests_hs',
            'smart_notification_rules', 'unusual_activities', 'work_break_types', 'work_breaks',
            'member_limits'
        )
    LOOP 
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%s_updated_at ON %s;
            CREATE TRIGGER update_%s_updated_at
                BEFORE UPDATE ON %s
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
            t, t, t, t);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 13. COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE projects IS 'Projects untuk time tracking, mirip dengan Hubstaff projects';
COMMENT ON TABLE tasks IS 'Tasks/To-dos dalam project, dapat di-assign ke members';
COMMENT ON TABLE teams IS 'Teams untuk grouping members, dengan lead options untuk permissions';
COMMENT ON TABLE activities IS 'Activity tracking per time slot (10 menit), mencatat keyboard/mouse activity';
COMMENT ON TABLE screenshots IS 'Screenshots yang diambil selama tracking, dengan blur option';
COMMENT ON TABLE tool_usages IS 'Tracking penggunaan aplikasi dan website per hari';
COMMENT ON TABLE timesheets IS 'Weekly timesheets untuk approval workflow';
COMMENT ON TABLE time_off_policies IS 'Kebijakan time off dengan accrual system';
COMMENT ON TABLE smart_notification_rules IS 'Rules untuk automated notifications berdasarkan metrics';
COMMENT ON TABLE unusual_activities IS 'Deteksi aktivitas tidak wajar/mencurigakan';
COMMENT ON TABLE job_sites IS 'Lokasi kerja dengan geofencing untuk field workers';
COMMENT ON TABLE work_break_types IS 'Jenis-jenis break yang tersedia dalam organisasi';
