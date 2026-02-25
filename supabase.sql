-- =============================================
-- PROJEK & PRESENSI MERGE SCHEMA (COMPATIBILITY FIX)
-- ---------------------------------------------
-- This script does the following:
-- 1. DROPS incompatible tables (projects, tasks, etc.) from the 'attendance_hubstaff.sql' structure.
-- 2. RE-CREATES them with correct references to 'organization_members' and 'organizations'.
-- 3. ADDS the new Scalable Teams structure.
-- =============================================

-- =============================================
-- 0. CLEANUP (Drop existing incompatible tables)
-- =============================================
-- CAUTION: This deletes existing data in these tables. 
-- Ensure you have backed up if you have real production data.
DROP TABLE IF EXISTS task_assignments CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS team_projects CASCADE; -- Drop relation before linked tables
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS projects CASCADE;


-- =============================================
-- 1. SCALABLE TEAMS (Cross-Department)
-- =============================================
-- Scalable: Links directly to Organization, not Department.
-- This allows a Team to have members from ANY department (Cross-Department).
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    parent_team_id INT REFERENCES teams(id) ON DELETE SET NULL, -- Scalable: Hierarchical teams
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,

    -- Flexible Settings (JSONB)
    settings JSONB DEFAULT '{
        "allow_public_join": false,
        "require_approval": true,
        "default_role": "member"
    }'::jsonb,

    -- Hubstaff-like Lead Options (Consolidated into metadata for cleaner schema)
    metadata JSONB DEFAULT '{
        "lead_options": {
            "approve_timesheets": true,
            "approve_time_off": true,
            "approve_manual_time": true,
            "schedule_shifts": true,
            "manage_team_projects": true,
            "manage_team_members": true,
            "view_screenshots": true
        }
    }'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, name)
);

CREATE INDEX IF NOT EXISTS idx_teams_organization ON teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_teams_parent ON teams(parent_team_id);


-- =============================================
-- 2. TEAM MEMBERS (Relation: Teams <-> Org Members)
-- =============================================
-- Cross-Department Support:
-- Members are linked via 'organization_member_id', which represents a user in the org.
-- Since an org member can belong to any department, this table allows mixing members from different departments in one team.
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    team_id INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    organization_member_id INT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('lead', 'manager', 'member', 'viewer')),
    is_primary_team BOOLEAN DEFAULT false,
    permissions JSONB DEFAULT '{}'::jsonb,

    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, organization_member_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_member ON team_members(organization_member_id);


-- =============================================
-- 3. PROJECTS (Compatible with Attendance System)
-- =============================================
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'on_hold', 'completed', 'archived', 'deleted')),
    priority VARCHAR(50) DEFAULT 'medium',
    
    start_date DATE,
    end_date DATE,
    
    -- Budgeting & Billing
    is_billable BOOLEAN DEFAULT true,
    currency_code CHAR(3) DEFAULT 'USD',
    budget_amount DECIMAL(15,2),
    budget_hours DECIMAL(10,2),
    
    -- Decoration
    color_code VARCHAR(7),
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(organization_id, code)
);

CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(code);


-- =============================================
-- 4. TEAM PROJECTS (Assignment: Teams <-> Projects)
-- =============================================
CREATE TABLE IF NOT EXISTS team_projects (
    team_id INT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    settings JSONB DEFAULT '{}'::jsonb,
    PRIMARY KEY (team_id, project_id)
);


-- =============================================
-- 5. PROJECT MEMBERS (Individual Assignment)
-- =============================================
CREATE TABLE IF NOT EXISTS project_members (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    organization_member_id INT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('manager', 'lead', 'member', 'viewer')),
    hourly_rate DECIMAL(10,2),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(project_id, organization_member_id)
);


-- =============================================
-- 6. TASKS (Granular Work Items)
-- =============================================
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_task_id INT REFERENCES tasks(id) ON DELETE SET NULL,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'archived', 'deleted')),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    estimated_hours DECIMAL(8,2),
    actual_hours DECIMAL(8,2) DEFAULT 0,
    due_date TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 2. TASK_ASSIGNEES (Many-to-Many: 1 task → N users, 1 user → N tasks)
CREATE TABLE IF NOT EXISTS task_assignees (
    id SERIAL PRIMARY KEY,
    task_id INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    organization_member_id INT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    
    -- Role support (assignee, reviewer, watcher)
    role VARCHAR(50) DEFAULT 'assignee' CHECK (role IN ('assignee', 'reviewer', 'watcher')),
    is_primary BOOLEAN DEFAULT false,  -- Primary assignee untuk quick lookup
    
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(task_id, organization_member_id)
);

-- 3. Production Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_hierarchy ON tasks(project_id, parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_task ON task_assignees(task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_member ON task_assignees(organization_member_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_role ON task_assignees(role);

-- Validasi Assignee (Task-level access) harus memiliki akses ke Project
CREATE OR REPLACE FUNCTION validate_task_assignee_access()
RETURNS TRIGGER AS $$
DECLARE
    target_project_id INT;
BEGIN
    -- Ambil project_id dari task terkait
    SELECT project_id INTO target_project_id FROM tasks WHERE id = NEW.task_id;

    -- Cek apakah assignee (user) punya akses ke project via Team atau Direct Project Member
    IF NOT EXISTS (
        -- Cek via Direct Project Members
        SELECT 1 FROM project_members 
        WHERE project_id = target_project_id AND organization_member_id = NEW.organization_member_id
        UNION
        -- Cek via Team Members
        SELECT 1 FROM team_members tm
        JOIN team_projects tp ON tm.team_id = tp.team_id
        WHERE tp.project_id = target_project_id AND tm.organization_member_id = NEW.organization_member_id
    ) THEN
        RAISE EXCEPTION 'User doesn`t have access to this project from this task (Not a Team Member or Project Member)';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_task_assignee
    BEFORE INSERT OR UPDATE OF organization_member_id ON task_assignees
    FOR EACH ROW EXECUTE FUNCTION validate_task_assignee_access();

-- =============================================
-- 7a. TIMESHEETS & ENTRIES (From Hubstaff)
-- =============================================

CREATE TABLE IF NOT EXISTS timesheets (
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

CREATE TABLE IF NOT EXISTS time_entries (
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

CREATE INDEX IF NOT EXISTS idx_timesheets_member ON timesheets(organization_member_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_dates ON timesheets(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_time_entries_member_date ON time_entries(organization_member_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_time_entries_project ON time_entries(project_id);


-- Activities (Hubstaff-style activity tracking per time slot)
CREATE TABLE IF NOT EXISTS activities (
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
CREATE TABLE IF NOT EXISTS idle_time_records (
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
CREATE TABLE IF NOT EXISTS time_edit_logs (
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

-- Indexes for Activity Tables
CREATE INDEX IF NOT EXISTS idx_activities_member_date ON activities(organization_member_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_activities_project ON activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_time_slot ON activities(time_slot);
CREATE INDEX IF NOT EXISTS idx_activities_timesheet ON activities(timesheet_id);


-- Screenshots Table
CREATE TABLE IF NOT EXISTS screenshots (
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
CREATE TABLE IF NOT EXISTS screenshot_settings (
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

-- Tool/App Usage Tracking
CREATE TABLE IF NOT EXISTS tool_usages (
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
CREATE TABLE IF NOT EXISTS url_visits (
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
CREATE TABLE IF NOT EXISTS productivity_categories (
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

-- Job Sites
CREATE TABLE IF NOT EXISTS job_sites (
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
CREATE TABLE IF NOT EXISTS job_site_visits (
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
CREATE TABLE IF NOT EXISTS location_logs (
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

-- Indexes for Location Tables
CREATE INDEX IF NOT EXISTS idx_job_sites_org ON job_sites(organization_id);
CREATE INDEX IF NOT EXISTS idx_job_site_visits_member ON job_site_visits(organization_member_id);
CREATE INDEX IF NOT EXISTS idx_location_logs_member_time ON location_logs(organization_member_id, captured_at);

-- Indexes for Screenshots & Usage
CREATE INDEX IF NOT EXISTS idx_screenshots_member_date ON screenshots(organization_member_id, screenshot_date);
CREATE INDEX IF NOT EXISTS idx_screenshots_activity ON screenshots(activity_id);
CREATE INDEX IF NOT EXISTS idx_tool_usages_member_date ON tool_usages(organization_member_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_url_visits_member_date ON url_visits(organization_member_id, visit_date);



-- =============================================
-- 7. HELPERS & RLS
-- =============================================

-- Updated_At Trigger Function (Assumed exists from attendance.sql, but safe to recreate if needed)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timesheets_updated_at BEFORE UPDATE ON timesheets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_screenshots_updated_at BEFORE UPDATE ON screenshots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_screenshot_settings_updated_at BEFORE UPDATE ON screenshot_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tool_usages_updated_at BEFORE UPDATE ON tool_usages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_url_visits_updated_at BEFORE UPDATE ON url_visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_productivity_categories_updated_at BEFORE UPDATE ON productivity_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_sites_updated_at BEFORE UPDATE ON job_sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_site_visits_updated_at BEFORE UPDATE ON job_site_visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE idle_time_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_edit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenshot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE productivity_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_logs ENABLE ROW LEVEL SECURITY;

-- Basic Organization Isolation Policies
CREATE POLICY "Teams visible to org" ON teams FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Projects visible to org" ON projects FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Tasks visible to org" ON tasks FOR SELECT USING (
    id IN (
        SELECT ta.task_id FROM task_assignees ta 
        WHERE ta.organization_member_id IN (
            SELECT id FROM organization_members WHERE user_id = auth.uid()
        )
    )
    OR project_id IN (
        SELECT project_id FROM project_members pm 
        WHERE pm.organization_member_id IN (
            SELECT id FROM organization_members WHERE user_id = auth.uid()
        )
    )
);
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Assignees see own relations" ON task_assignees FOR SELECT USING (
    organization_member_id IN (SELECT id FROM organization_members WHERE user_id = auth.uid())
);
CREATE POLICY "Timesheets visible to own" ON timesheets FOR SELECT USING (organization_member_id IN (SELECT id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Time entries visible to own" ON time_entries FOR SELECT USING (organization_member_id IN (SELECT id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Activities visible to own" ON activities FOR SELECT USING (organization_member_id IN (SELECT id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Idle records visible to own" ON idle_time_records FOR SELECT USING (organization_member_id IN (SELECT id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Time edit logs visible to own" ON time_edit_logs FOR SELECT USING (user_id = auth.uid() OR edited_by = auth.uid());
CREATE POLICY "Screenshots visible to own" ON screenshots FOR SELECT USING (organization_member_id IN (SELECT id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Screenshot settings visible to org" ON screenshot_settings FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Tool usages visible to own" ON tool_usages FOR SELECT USING (organization_member_id IN (SELECT id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "URL visits visible to own" ON url_visits FOR SELECT USING (organization_member_id IN (SELECT id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Productivity categories visible to org" ON productivity_categories FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Job sites visible to org" ON job_sites FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Job site visits visible to own" ON job_site_visits FOR SELECT USING (organization_member_id IN (SELECT id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Location logs visible to own" ON location_logs FOR SELECT USING (organization_member_id IN (SELECT id FROM organization_members WHERE user_id = auth.uid()));


-- =============================================
-- 8. WORK BREAKS (NEW + INTEGRATED)
-- =============================================

-- Work Break Types (Hubstaff Policies)
CREATE TABLE IF NOT EXISTS work_break_types (
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

-- Work Breaks (Actual Events) - FULLY INTEGRATED
CREATE TABLE IF NOT EXISTS work_breaks (
    id SERIAL PRIMARY KEY,
    organization_member_id INT NOT NULL REFERENCES organization_members(id),
    work_break_type_id INT REFERENCES work_break_types(id),
    break_date DATE NOT NULL,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INT,
    status VARCHAR(50) DEFAULT 'active',
    -- INTEGRATION LINKS (Hubstaff-style)
    attendance_record_id INT REFERENCES attendance_records(id) ON DELETE CASCADE,
    work_schedule_id INT REFERENCES work_schedules(id),
    shift_id INT REFERENCES shifts(id),
    time_entry_id INT REFERENCES time_entries(id),

    -- Device & Method Tracking
    start_device_id INT REFERENCES attendance_devices(id),
    end_device_id INT REFERENCES attendance_devices(id),
    start_method VARCHAR(50),
    end_method VARCHAR(50),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_break_status CHECK (status IN ('active', 'completed', 'exceeded'))
);

-- Ensure columns exist in attendance_records
ALTER TABLE attendance_records 
ADD COLUMN IF NOT EXISTS actual_break_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS actual_break_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS break_in_device_id INT REFERENCES attendance_devices(id),
ADD COLUMN IF NOT EXISTS break_out_device_id INT REFERENCES attendance_devices(id),
ADD COLUMN IF NOT EXISTS break_in_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS break_out_method VARCHAR(50);

-- Ensure the column exists in work_breaks if the table was created previously
ALTER TABLE work_breaks 
ADD COLUMN IF NOT EXISTS attendance_record_id INT REFERENCES attendance_records(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS start_device_id INT REFERENCES attendance_devices(id),
ADD COLUMN IF NOT EXISTS end_device_id INT REFERENCES attendance_devices(id),
ADD COLUMN IF NOT EXISTS start_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS end_method VARCHAR(50);

-- Index for better join performance
CREATE INDEX IF NOT EXISTS idx_work_breaks_attendance ON work_breaks(attendance_record_id);

-- Automated Break Duration & Timestamp Calculation for Attendance Records
CREATE OR REPLACE FUNCTION sync_attendance_break_duration()
RETURNS TRIGGER AS $$
BEGIN
    -- Update stats in attendance_records: duration, first break start, and last break end
    UPDATE attendance_records
    SET 
        break_duration_minutes = (
            SELECT COALESCE(SUM(duration_seconds), 0) / 60
            FROM work_breaks
            WHERE attendance_record_id = COALESCE(NEW.attendance_record_id, OLD.attendance_record_id)
            AND status IN ('completed', 'exceeded')
        ),
        actual_break_start = (
            SELECT MIN(starts_at)
            FROM work_breaks
            WHERE attendance_record_id = COALESCE(NEW.attendance_record_id, OLD.attendance_record_id)
        ),
        actual_break_end = (
            SELECT MAX(ends_at)
            FROM work_breaks
            WHERE attendance_record_id = COALESCE(NEW.attendance_record_id, OLD.attendance_record_id)
            AND status IN ('completed', 'exceeded')
        ),
        break_in_device_id = (
            SELECT start_device_id FROM work_breaks
            WHERE attendance_record_id = COALESCE(NEW.attendance_record_id, OLD.attendance_record_id)
            ORDER BY starts_at ASC LIMIT 1
        ),
        break_in_method = (
            SELECT start_method FROM work_breaks
            WHERE attendance_record_id = COALESCE(NEW.attendance_record_id, OLD.attendance_record_id)
            ORDER BY starts_at ASC LIMIT 1
        ),
        break_out_device_id = (
            SELECT end_device_id FROM work_breaks
            WHERE attendance_record_id = COALESCE(NEW.attendance_record_id, OLD.attendance_record_id)
            AND status IN ('completed', 'exceeded')
            ORDER BY ends_at DESC LIMIT 1
        ),
        break_out_method = (
            SELECT end_method FROM work_breaks
            WHERE attendance_record_id = COALESCE(NEW.attendance_record_id, OLD.attendance_record_id)
            AND status IN ('completed', 'exceeded')
            ORDER BY ends_at DESC LIMIT 1
        )
    WHERE id = COALESCE(NEW.attendance_record_id, OLD.attendance_record_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_break_duration
    AFTER INSERT OR UPDATE OF duration_seconds, status OR DELETE ON work_breaks
    FOR EACH ROW EXECUTE FUNCTION sync_attendance_break_duration();

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_work_breaks_member_date ON work_breaks(organization_member_id, break_date);
CREATE INDEX IF NOT EXISTS idx_work_breaks_status ON work_breaks(status);
CREATE INDEX IF NOT EXISTS idx_work_breaks_schedule ON work_breaks(work_schedule_id);
CREATE INDEX IF NOT EXISTS idx_work_breaks_shift ON work_breaks(shift_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE work_break_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_breaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org break types" ON work_break_types
FOR ALL USING (organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = auth.uid()
));

CREATE POLICY "Work breaks access" ON work_breaks
FOR ALL USING (
    organization_member_id IN (
        SELECT id FROM organization_members 
        WHERE organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    )
);

-- =============================================
-- FUNCTIONS & TRIGGERS (Auto-status update)
-- =============================================
CREATE OR REPLACE FUNCTION update_break_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ends_at IS NOT NULL AND NEW.duration_seconds > 0 THEN
        NEW.status = 'completed';
    ELSIF NEW.starts_at < NOW() - INTERVAL '2 hours' THEN
        NEW.status = 'exceeded';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_break_status
    BEFORE UPDATE ON work_breaks
    FOR EACH ROW EXECUTE FUNCTION update_break_status();

-- Trigger for updated_at
CREATE TRIGGER update_work_break_types_updated_at BEFORE UPDATE ON work_break_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_breaks_updated_at BEFORE UPDATE ON work_breaks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =============================================
-- 10. MEMBER LIMITS (ADD TO YOUR MERGE)
-- =============================================

-- Member Limits (Hubstaff Limits & Expectations)
CREATE TABLE IF NOT EXISTS member_limits (
    id SERIAL PRIMARY KEY,
    organization_member_id INT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    daily_limit_hours DECIMAL(5,2),
    weekly_limit_hours DECIMAL(5,2),
    expected_per_week_hours DECIMAL(5,2),
    limits_by_shifts BOOLEAN DEFAULT false,
    allowed_days VARCHAR(3)[],        -- ['mon','tue','wed','thu','fri']
    expected_days VARCHAR(3)[],
    current_daily_override_hours DECIMAL(5,2),
    current_weekly_override_hours DECIMAL(5,2),
    -- Hubstaff Refinements
    weekly_cost_limit DECIMAL(15,2),
    limit_action VARCHAR(50) DEFAULT 'notify',
    notification_threshold INT DEFAULT 90,
    -- Hubstaff Integration Links
    work_schedule_id INT REFERENCES work_schedules(id),
    shift_id INT REFERENCES shifts(id),
    team_id INT REFERENCES teams(id),     -- NEW: Team-based limits
    project_id INT REFERENCES projects(id), -- NEW: Project-specific limits
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_member_id)
);

-- Separate constraints for better production safety & error message
ALTER TABLE member_limits 
ADD CONSTRAINT chk_limit_action CHECK (limit_action IN ('notify', 'stop_tracking')),
ADD CONSTRAINT chk_notification_threshold CHECK (notification_threshold > 0 AND notification_threshold <= 100);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_member_limits_member ON member_limits(organization_member_id);
CREATE INDEX IF NOT EXISTS idx_member_limits_team ON member_limits(team_id);
CREATE INDEX IF NOT EXISTS idx_member_limits_project ON member_limits(project_id);

-- RLS
ALTER TABLE member_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Member own limits" ON member_limits
FOR ALL USING (
    organization_member_id IN (
        SELECT id FROM organization_members WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Team leads manage limits" ON member_limits
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = member_limits.team_id 
        AND tm.role IN ('lead', 'manager')
        AND tm.organization_member_id IN (
            SELECT id FROM organization_members WHERE user_id = auth.uid()
        )
    )
    OR EXISTS (
        SELECT 1 FROM organization_members om
        JOIN organization_member_roles omr ON om.id = omr.organization_member_id
        JOIN system_roles sr ON omr.role_id = sr.id
        WHERE om.user_id = auth.uid()
        AND sr.code IN ('super_admin', 'org_admin')
        AND om.organization_id = (
            SELECT organization_id FROM organization_members 
            WHERE id = member_limits.organization_member_id
        )
    )
);

-- Auto-generate limits from schedule/team
CREATE OR REPLACE FUNCTION auto_set_member_limits()
RETURNS TRIGGER AS $$
DECLARE
    schedule_hours DECIMAL(5,2) := 40;
    member_rate DECIMAL(10,2);
BEGIN
    -- From work schedule
    SELECT COALESCE(SUM(wd.minimum_hours), 40) INTO schedule_hours
    FROM work_schedule_details wd
    JOIN work_schedules ws ON wd.work_schedule_id = ws.id
    WHERE ws.id = NEW.work_schedule_id AND wd.is_working_day = true;

    -- Get member hourly rate if linked to a project
    IF NEW.project_id IS NOT NULL THEN
        SELECT hourly_rate INTO member_rate 
        FROM project_members 
        WHERE project_id = NEW.project_id 
        AND organization_member_id = NEW.organization_member_id;
    END IF;

    NEW.expected_per_week_hours := schedule_hours;
    NEW.weekly_limit_hours := schedule_hours * 1.1; -- 10% buffer
    
    -- Auto-set cost limit if rate is found
    IF member_rate > 0 THEN
        NEW.weekly_cost_limit := NEW.weekly_limit_hours * member_rate;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_set_member_limits
    BEFORE INSERT OR UPDATE OF work_schedule_id, team_id ON member_limits
    FOR EACH ROW EXECUTE FUNCTION auto_set_member_limits();

-- Updated_at trigger
CREATE TRIGGER update_member_limits_updated_at 
BEFORE UPDATE ON member_limits 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =============================================
-- 11. INDEXES FOR PERFORMANCE (Hubstaff Optimized)
-- =============================================

-- Activities (High volume)
CREATE INDEX IF NOT EXISTS idx_activities_member_date ON activities(organization_member_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_activities_project ON activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_time_slot ON activities(time_slot DESC);
CREATE INDEX IF NOT EXISTS idx_activities_timesheet ON activities(timesheet_id);

-- Screenshots (10K+/day)
CREATE INDEX IF NOT EXISTS idx_screenshots_member_date ON screenshots(organization_member_id, screenshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_screenshots_recorded_at ON screenshots(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_screenshots_activity ON screenshots(activity_id);

-- Time Entries (Core)
CREATE INDEX IF NOT EXISTS idx_time_entries_member_date ON time_entries(organization_member_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_time_entries_project ON time_entries(project_id) WHERE is_billable = true;
CREATE INDEX IF NOT EXISTS idx_time_entries_timesheet ON time_entries(timesheet_id);

-- Productivity Tracking
CREATE INDEX IF NOT EXISTS idx_tool_usages_member_date ON tool_usages(organization_member_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_tool_usages_tool_name ON tool_usages(tool_name);
CREATE INDEX IF NOT EXISTS idx_url_visits_member_date ON url_visits(organization_member_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_url_visits_domain ON url_visits(domain);

-- GPS/Location
CREATE INDEX IF NOT EXISTS idx_location_logs_member_time ON location_logs(organization_member_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_site_visits_site ON job_site_visits(job_site_id);
CREATE INDEX IF NOT EXISTS idx_job_site_visits_member ON job_site_visits(organization_member_id);

-- Dashboard Core
CREATE INDEX IF NOT EXISTS idx_timesheets_member_dates ON timesheets(organization_member_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_timesheets_status ON timesheets(status) WHERE status IN ('open', 'submitted');
CREATE INDEX IF NOT EXISTS idx_projects_org_status ON projects(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status);

-- Teams & Management
CREATE INDEX IF NOT EXISTS idx_teams_org ON teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_member ON team_members(organization_member_id);

-- =============================================
-- 12. TRIGGERS FOR UPDATED_AT (Dynamic)
-- =============================================
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
            'task_assignees', 'timesheets', 'time_entries', 'activities', 'screenshots', 
            'screenshot_settings', 'tool_usages', 'url_visits', 'productivity_categories', 
            'job_sites', 'job_site_visits', 'work_break_types', 'work_breaks', 'member_limits'
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
-- 13. DOCUMENTATION COMMENTS (Team Ready)
-- =============================================
COMMENT ON TABLE projects IS 'Projects untuk time tracking Hubstaff-style dengan budget & billing';
COMMENT ON TABLE tasks IS 'Tasks hierarchical dengan assignee & time estimates';
COMMENT ON TABLE teams IS 'Cross-department teams dengan lead permissions JSONB';
COMMENT ON TABLE activities IS 'Activity tracking 10 menit slots (keyboard/mouse/input)';
COMMENT ON TABLE screenshots IS 'Screenshots otomatis dengan blur/delete options';
COMMENT ON TABLE timesheets IS 'Weekly timesheets approval workflow';
COMMENT ON TABLE tool_usages IS 'App/website usage tracking dengan productivity score';
COMMENT ON TABLE work_breaks IS 'Break tracking terintegrasi schedules + time_entries';
COMMENT ON TABLE member_limits IS 'Hubstaff limits (hours/cost) dengan auto-calculation';
COMMENT ON TABLE job_sites IS 'Geofencing untuk field workers + auto project switch';
COMMENT ON TABLE task_assignees IS 'Many-to-many assignment antara tasks dan organization members';

-- =============================================
-- 14. VIEWS FOR DASHBOARDS (Hubstaff Reports)
-- =============================================

-- View to see active tasks with all their assignees aggregated
CREATE OR REPLACE VIEW active_tasks_with_assignees AS
SELECT 
    t.*,
    json_agg(
        json_build_object(
            
            'id', om.id,
            'name', up.display_name,
            'role', ta.role,
            'is_primary', ta.is_primary
        )
    ) FILTER (WHERE ta.organization_member_id IS NOT NULL) as assignees,
    COUNT(ta.id) as assignee_count
FROM tasks t
LEFT JOIN task_assignees ta ON t.id = ta.task_id
LEFT JOIN organization_members om ON ta.organization_member_id = om.id
LEFT JOIN user_profiles up ON om.user_id = up.id
WHERE t.status != 'archived'
GROUP BY t.id;

CREATE OR REPLACE VIEW member_limits_dashboard AS
SELECT 
    ml.*,
    up.display_name,
    om.employee_id,
    COALESCE(SUM(te.duration_seconds)/3600.0, 0) as current_week_hours,
    ROUND(
        COALESCE(SUM(te.duration_seconds)/3600.0 / NULLIF(ml.weekly_limit_hours, 0) * 100, 0)
    ) as compliance_pct,
    CASE 
        WHEN SUM(te.duration_seconds)/3600.0 >= ml.weekly_limit_hours THEN 'LIMIT_REACHED'
        ELSE 'OK'
    END as status
FROM member_limits ml
JOIN organization_members om ON ml.organization_member_id = om.id
JOIN user_profiles up ON om.user_id = up.id
LEFT JOIN time_entries te ON om.id = te.organization_member_id
    AND te.entry_date >= date_trunc('week', CURRENT_DATE)
GROUP BY ml.id, up.display_name, om.employee_id;

-- =============================================
-- 15. SAMPLE DATA (Testing)
-- =============================================
INSERT INTO work_break_types (organization_id, name, duration_seconds, is_paid) VALUES
(1, 'Lunch Break', 3600, false),
(1, 'Short Break', 900, true)
ON CONFLICT DO NOTHING;

INSERT INTO member_limits (organization_member_id, daily_limit_hours, weekly_limit_hours, allowed_days) VALUES
(1, 10.0, 50.0, ARRAY['mon','tue','wed','thu','fri'])
ON CONFLICT DO NOTHING;

-- Multi-Assignee Tasks Sample Data
INSERT INTO tasks (project_id, name, status, priority, estimated_hours) VALUES
(1, 'Build Login Page', 'todo', 'high', 16.0),
(1, 'Payment Integration', 'in_progress', 'urgent', 32.0),
(1, 'User Profile', 'todo', 'medium', 8.0)
ON CONFLICT DO NOTHING;

-- Multiple assignees per task
-- Note: Replace 123, 456, etc. with valid organization_member_ids in real tests
-- Using dummy IDs for schema demonstration
INSERT INTO task_assignees (task_id, organization_member_id, role, is_primary) VALUES
(1, 1, 'assignee', true),   -- Lead
(1, 2, 'assignee', false),  -- Support
(1, 3, 'reviewer', false),  -- QA
(2, 2, 'assignee', true),   -- Lead
(2, 1, 'assignee', false)   -- Support
ON CONFLICT DO NOTHING;

-- Archive example (simulation - will fail if tasks table is empty/ID doesn't exist)
-- UPDATE tasks SET status = 'archived' WHERE id = 1;

-- =============================================
-- 16. CLIENT & BILLING MANAGEMENT (Hubstaff)
-- =============================================

-- Clients
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    budget_type VARCHAR(20) DEFAULT 'total_hours',
    budget_amount DECIMAL(15,2),
    budget_currency CHAR(3) DEFAULT 'USD',
    notify_percentage INT DEFAULT 80,
    invoice_notes TEXT,
    net_terms_days INT DEFAULT 30,
    auto_invoice_frequency VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_client_budget CHECK (budget_type IN ('total_hours', 'total_cost', 'monthly_hours', 'monthly_cost')),
    CONSTRAINT chk_client_status CHECK (status IN ('active', 'inactive', 'archived', 'deleted'))
);

CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- Client-Projects (Many-to-Many)
CREATE TABLE IF NOT EXISTS client_projects (
    client_id INT REFERENCES clients(id) ON DELETE CASCADE,
    project_id INT REFERENCES projects(id) ON DELETE CASCADE,
    billable BOOLEAN DEFAULT true,
    record_activity BOOLEAN DEFAULT true,
    PRIMARY KEY (client_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_client_projects_project ON client_projects(project_id);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id INT REFERENCES clients(id),
    invoice_number VARCHAR(100) UNIQUE,
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
    subtotal DECIMAL(15,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    currency CHAR(3) DEFAULT 'USD',
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Invoice Line Items
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id SERIAL PRIMARY KEY,
    invoice_id INT REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT,
    quantity DECIMAL(12,2),
    unit_price DECIMAL(15,2),
    total DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- Payments (Financial Tracking)
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    invoice_id INT REFERENCES invoices(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client Contacts
CREATE TABLE IF NOT EXISTS client_contacts (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, email)
);

-- =============================================
-- 17. BILLING FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION generate_client_invoice(p_client_id INT, p_date_start DATE, p_date_end DATE)
RETURNS INT AS $$
DECLARE
    v_new_invoice_id INT;
    v_org_id INT;
BEGIN
    -- Resolve Org ID
    SELECT organization_id INTO v_org_id FROM clients WHERE id = p_client_id;

    -- Create invoice header
    INSERT INTO invoices (organization_id, client_id, issue_date, due_date)
    VALUES (v_org_id, p_client_id, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days')
    RETURNING id INTO v_new_invoice_id;
    
    -- In standard Hubstaff, this would then calculate quantity from time_entries
    -- This is a placeholder for actual billing logic based on project_members.hourly_rate
    
    RETURN v_new_invoice_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 18. RLS POLICIES (Billing & Security)
-- =============================================

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_breaks ENABLE ROW LEVEL SECURITY;

-- Clients
CREATE POLICY "Clients visible to org members" ON clients
FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins manage clients" ON clients
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM organization_members om
        JOIN organization_member_roles omr ON om.id = omr.organization_member_id
        JOIN system_roles sr ON omr.role_id = sr.id
        WHERE om.organization_id = clients.organization_id
        AND om.user_id = auth.uid()
        AND sr.code IN ('owner', 'admin')
    )
);

-- Invoices
CREATE POLICY "Invoices visible to org members" ON invoices
FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Admins manage invoices" ON invoices
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM organization_members om
        JOIN organization_member_roles omr ON om.id = omr.organization_member_id
        JOIN system_roles sr ON omr.role_id = sr.id
        WHERE om.organization_id = invoices.organization_id
        AND om.user_id = auth.uid()
        AND sr.code IN ('owner', 'admin')
    )
);

-- Child Relations Policies
CREATE POLICY "Access invoice line items via invoice" ON invoice_line_items FOR ALL USING (EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_id));
CREATE POLICY "Access payments via invoice" ON payments FOR ALL USING (EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_id));
CREATE POLICY "Access client projects via client" ON client_projects FOR ALL USING (EXISTS (SELECT 1 FROM clients c WHERE c.id = client_id));
CREATE POLICY "Access client contacts via client" ON client_contacts FOR ALL USING (EXISTS (SELECT 1 FROM clients c WHERE c.id = client_id));
