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
    status VARCHAR(50) DEFAULT 'todo',
    priority VARCHAR(50) DEFAULT 'medium',
    
    estimated_hours DECIMAL(8,2),
    actual_hours DECIMAL(8,2) DEFAULT 0,
    due_date TIMESTAMP WITH TIME ZONE,
    
    -- Single Assignee Support (Simpler than many-to-many)
    assignee_id INT REFERENCES organization_members(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);


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

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Basic Organization Isolation Policies
CREATE POLICY "Teams visible to org" ON teams FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Projects visible to org" ON projects FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Tasks visible to org" ON tasks FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));
