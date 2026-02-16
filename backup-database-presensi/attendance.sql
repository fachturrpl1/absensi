-- =============================================
-- ATTENDANCE MANAGEMENT SYSTEM DATABASE SCHEMA
-- Version: 2.1
-- Integrated with Supabase Auth
-- Only tables related to auth.users use UUID
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. CORE SYSTEM TABLES
-- =============================================

-- Applications Table (Third-party integrations)
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    developer VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    api_secret VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- =============================================
-- 2. ORGANIZATION MANAGEMENT
-- =============================================

-- Organizations Table
CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    tax_id VARCHAR(50),
    industry VARCHAR(100),
    size_category VARCHAR(50),
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency_code CHAR(3) DEFAULT 'USD',
    country_code CHAR(2) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    subscription_tier VARCHAR(50),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_org_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Organization Settings
CREATE TABLE organization_settings (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, setting_key)
);

-- =============================================
-- 3. USER & ROLE MANAGEMENT (Integrated with Supabase Auth)
-- =============================================

-- User Profiles Table (Extends Supabase Auth Users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_code VARCHAR(50),
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(20),
    nationality VARCHAR(100),
    national_id VARCHAR(100),
    profile_photo_url VARCHAR(500),
    emergency_contact JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_gender CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'))
);

-- System Roles (Global roles)
CREATE TABLE system_roles (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    priority INT DEFAULT 0,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Permissions
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    module VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    code VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(module, resource, action)
);

-- Role Permissions (Many-to-Many)
CREATE TABLE role_permissions (
    role_id INT NOT NULL REFERENCES system_roles(id) ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

-- Organization Members (Users in Organizations)
CREATE TABLE organization_members (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    employee_id VARCHAR(50),
    department_id INT,
    position_id INT,
    direct_manager_id INT REFERENCES organization_members(id),
    hire_date DATE NOT NULL,
    probation_end_date DATE,
    contract_type VARCHAR(50),
    employment_status VARCHAR(50) DEFAULT 'active',
    termination_date DATE,
    work_location VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, user_id),
    UNIQUE(organization_id, employee_id)
);

-- Organization Member Roles
CREATE TABLE organization_member_roles (
    id SERIAL PRIMARY KEY,
    organization_member_id INT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES system_roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES user_profiles(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(organization_member_id, role_id)
);

-- Departments
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    parent_department_id INT REFERENCES departments(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    head_member_id INT REFERENCES organization_members(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, code)
);

-- Positions/Job Titles
CREATE TABLE positions (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    level INT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, code)
);

-- =============================================
-- 4. ATTENDANCE DEVICE MANAGEMENT
-- =============================================

-- Device Types
CREATE TABLE device_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    specifications JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Attendance Devices
CREATE TABLE attendance_devices (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    device_type_id INT NOT NULL REFERENCES device_types(id),
    device_code VARCHAR(100) NOT NULL,
    device_name VARCHAR(255) NOT NULL,
    serial_number VARCHAR(255),
    ip_address INET,
    mac_address MACADDR,
    location VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    radius_meters INT,
    firmware_version VARCHAR(50),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    configuration JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, device_code)
);

-- =============================================
-- 5. WORK SCHEDULE MANAGEMENT
-- =============================================

-- Work Schedules
CREATE TABLE work_schedules (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    schedule_type VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, code)
);

-- Work Schedule Details
CREATE TABLE work_schedule_details (
    id SERIAL PRIMARY KEY,
    work_schedule_id INT NOT NULL REFERENCES work_schedules(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    is_working_day BOOLEAN DEFAULT true,
    start_time TIME,
    end_time TIME,
    break_start TIME,
    break_end TIME,
    break_duration_minutes INT,
    flexible_hours BOOLEAN DEFAULT false,
    core_hours_start TIME,
    core_hours_end TIME,
    minimum_hours DECIMAL(4,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(work_schedule_id, day_of_week)
);

-- Shifts
CREATE TABLE shifts (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    overnight BOOLEAN DEFAULT false,
    break_duration_minutes INT DEFAULT 0,
    color_code VARCHAR(7),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, code)
);

-- Member Schedule Assignments
CREATE TABLE member_schedules (
    id SERIAL PRIMARY KEY,
    organization_member_id INT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    work_schedule_id INT REFERENCES work_schedules(id),
    shift_id INT REFERENCES shifts(id),
    effective_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_schedule_or_shift CHECK (
        (work_schedule_id IS NOT NULL AND shift_id IS NULL) OR
        (work_schedule_id IS NULL AND shift_id IS NOT NULL)
    )
);

-- Shift Assignments
CREATE TABLE shift_assignments (
    id SERIAL PRIMARY KEY,
    organization_member_id INT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    shift_id INT NOT NULL REFERENCES shifts(id),
    assignment_date DATE NOT NULL,
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_member_id, assignment_date)
);

-- =============================================
-- 6. HOLIDAY MANAGEMENT
-- =============================================

-- Holiday Templates
CREATE TABLE holiday_templates (
    id SERIAL PRIMARY KEY,
    country_code CHAR(2) NOT NULL,
    name VARCHAR(255) NOT NULL,
    holiday_type VARCHAR(50),
    is_fixed_date BOOLEAN DEFAULT true,
    fixed_month INT CHECK (fixed_month BETWEEN 1 AND 12),
    fixed_day INT CHECK (fixed_day BETWEEN 1 AND 31),
    calculation_rule TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Organization Holidays
CREATE TABLE organization_holidays (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    holiday_template_id INT REFERENCES holiday_templates(id),
    name VARCHAR(255) NOT NULL,
    holiday_date DATE NOT NULL,
    holiday_type VARCHAR(50),
    is_paid BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, holiday_date, name)
);

-- =============================================
-- 7. ATTENDANCE RECORDS
-- =============================================

-- Attendance Records
CREATE TABLE attendance_records (
    id SERIAL PRIMARY KEY,
    organization_member_id INT NOT NULL REFERENCES organization_members(id),
    attendance_date DATE NOT NULL,
    scheduled_shift_id INT REFERENCES shifts(id),
    scheduled_start TIME,
    scheduled_end TIME,
    actual_check_in TIMESTAMP WITH TIME ZONE,
    actual_check_out TIMESTAMP WITH TIME ZONE,
    check_in_device_id INT REFERENCES attendance_devices(id),
    check_out_device_id INT REFERENCES attendance_devices(id),
    check_in_method VARCHAR(50),
    check_out_method VARCHAR(50),
    check_in_location JSONB,
    check_out_location JSONB,
    check_in_photo_url VARCHAR(500),
    check_out_photo_url VARCHAR(500),
    work_duration_minutes INT,
    break_duration_minutes INT,
    overtime_minutes INT,
    late_minutes INT,
    early_leave_minutes INT,
    status VARCHAR(50),
    validation_status VARCHAR(50) DEFAULT 'pending',
    validated_by UUID REFERENCES user_profiles(id),
    validated_at TIMESTAMP WITH TIME ZONE,
    validation_note TEXT,
    application_id INT REFERENCES applications(id),
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_member_id, attendance_date)
);

-- Attendance Logs
CREATE TABLE attendance_logs (
    id SERIAL PRIMARY KEY,
    organization_member_id INT NOT NULL REFERENCES organization_members(id),
    attendance_record_id INT REFERENCES attendance_records(id),
    event_type VARCHAR(50) NOT NULL,
    event_time TIMESTAMP WITH TIME ZONE NOT NULL,
    device_id INT REFERENCES attendance_devices(id),
    method VARCHAR(50) NOT NULL,
    location JSONB,
    ip_address INET,
    user_agent TEXT,
    application_id INT REFERENCES applications(id),
    is_verified BOOLEAN DEFAULT false,
    verification_method VARCHAR(50),
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Biometric Data
CREATE TABLE biometric_data (
    id SERIAL PRIMARY KEY,
    organization_member_id INT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    biometric_type VARCHAR(50) NOT NULL,
    template_data TEXT NOT NULL,
    device_id INT REFERENCES attendance_devices(id),
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RFID Cards
CREATE TABLE rfid_cards (
    id SERIAL PRIMARY KEY,
    organization_member_id INT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    card_number VARCHAR(255) UNIQUE NOT NULL,
    card_type VARCHAR(50),
    issue_date DATE NOT NULL,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT true,
    is_lost BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 8. LEAVE MANAGEMENT
-- =============================================

-- Leave Types
CREATE TABLE leave_types (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    days_per_year DECIMAL(5,2),
    carry_forward_allowed BOOLEAN DEFAULT false,
    max_carry_forward_days DECIMAL(5,2),
    requires_approval BOOLEAN DEFAULT true,
    requires_document BOOLEAN DEFAULT false,
    minimum_days_notice INT DEFAULT 1,
    color_code VARCHAR(7),
    is_paid BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, code)
);

-- Leave Balances
CREATE TABLE leave_balances (
    id SERIAL PRIMARY KEY,
    organization_member_id INT NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    leave_type_id INT NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    year INT NOT NULL,
    entitled_days DECIMAL(5,2) NOT NULL,
    carried_forward_days DECIMAL(5,2) DEFAULT 0,
    used_days DECIMAL(5,2) DEFAULT 0,
    pending_days DECIMAL(5,2) DEFAULT 0,
    remaining_days DECIMAL(5,2) GENERATED ALWAYS AS 
        (entitled_days + carried_forward_days - used_days - pending_days) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_member_id, leave_type_id, year)
);

-- Leave Requests
CREATE TABLE leave_requests (
    id SERIAL PRIMARY KEY,
    organization_member_id INT NOT NULL REFERENCES organization_members(id),
    leave_type_id INT NOT NULL REFERENCES leave_types(id),
    request_number VARCHAR(50) UNIQUE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_half_day BOOLEAN DEFAULT false,
    end_half_day BOOLEAN DEFAULT false,
    total_days DECIMAL(5,2) NOT NULL,
    reason TEXT NOT NULL,
    emergency_contact VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_by UUID REFERENCES user_profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_note TEXT,
    rejected_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    document_urls TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Leave Approval Workflow
CREATE TABLE leave_approvals (
    id SERIAL PRIMARY KEY,
    leave_request_id INT NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES user_profiles(id),
    approval_level INT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    comments TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(leave_request_id, approval_level)
);

-- =============================================
-- 9. OVERTIME MANAGEMENT
-- =============================================

-- Overtime Rules
CREATE TABLE overtime_rules (
    id SERIAL PRIMARY KEY,
    organization_id INT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    minimum_minutes INT DEFAULT 30,
    calculation_method VARCHAR(50),
    weekday_multiplier DECIMAL(3,2) DEFAULT 1.5,
    weekend_multiplier DECIMAL(3,2) DEFAULT 2.0,
    holiday_multiplier DECIMAL(3,2) DEFAULT 3.0,
    requires_approval BOOLEAN DEFAULT true,
    auto_calculate BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Overtime Requests
CREATE TABLE overtime_requests (
    id SERIAL PRIMARY KEY,
    organization_member_id INT NOT NULL REFERENCES organization_members(id),
    request_number VARCHAR(50) UNIQUE NOT NULL,
    overtime_date DATE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INT NOT NULL,
    overtime_type VARCHAR(50),
    multiplier DECIMAL(3,2) DEFAULT 1.5,
    reason TEXT NOT NULL,
    project_code VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_by UUID REFERENCES user_profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_note TEXT,
    rejected_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 10. AUDIT & LOGGING
-- =============================================

-- Audit Logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    organization_id INT REFERENCES organizations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System Logs
CREATE TABLE system_logs (
    id SERIAL PRIMARY KEY,
    log_level VARCHAR(20) NOT NULL,
    source VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    context JSONB,
    stack_trace TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 11. NOTIFICATIONS
-- =============================================

-- Notification Templates
CREATE TABLE notification_templates (
    id SERIAL PRIMARY KEY,
    organization_id INT REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    body_template TEXT NOT NULL,
    variables JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    -- UNIQUE(COALESCE(organization_id, 0), code)
);

-- Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    organization_id INT REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    template_id INT REFERENCES notification_templates(id),
    channel VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    body TEXT NOT NULL,
    data JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- -- Enable RLS on all tables
-- ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE system_roles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE organization_member_roles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE device_types ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE attendance_devices ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE work_schedule_details ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE member_schedules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE holiday_templates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE organization_holidays ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE biometric_data ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE rfid_cards ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE leave_approvals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE overtime_rules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE overtime_requests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- -- Policies for user_profiles
-- CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
-- CREATE POLICY "Super admins can manage all profiles" ON user_profiles FOR ALL USING (
--     EXISTS (
--         SELECT 1 FROM organization_member_roles omr
--         JOIN organization_members om ON omr.organization_member_id = om.id
--         JOIN system_roles sr ON omr.role_id = sr.id
--         WHERE om.user_id = auth.uid() AND sr.code = 'super_admin'
--     )
-- );

-- -- Policies for organization_members
-- CREATE POLICY "Users can view their own organization membership" ON organization_members FOR SELECT USING (user_id = auth.uid());
-- CREATE POLICY "Organization admins can manage members" ON organization_members FOR ALL USING (
--     EXISTS (
--         SELECT 1 FROM organization_member_roles omr
--         JOIN organization_members om ON omr.organization_member_id = om.id
--         JOIN system_roles sr ON omr.role_id = sr.id
--         WHERE om.user_id = auth.uid() 
--         AND (sr.code = 'super_admin' OR sr.code = 'org_admin')
--         AND om.organization_id = organization_members.organization_id
--     )
-- );

-- -- Policies for attendance_records
-- CREATE POLICY "Users can view their own attendance records" ON attendance_records FOR SELECT USING (
--     organization_member_id IN (
--         SELECT id FROM organization_members WHERE user_id = auth.uid()
--     )
-- );
-- CREATE POLICY "Managers can manage team attendance" ON attendance_records FOR ALL USING (
--     EXISTS (
--         SELECT 1 FROM organization_members om
--         WHERE om.id = attendance_records.organization_member_id
--         AND om.direct_manager_id IN (
--             SELECT id FROM organization_members WHERE user_id = auth.uid()
--         )
--     )
--     OR EXISTS (
--         SELECT 1 FROM organization_member_roles omr
--         JOIN organization_members om ON omr.organization_member_id = om.id
--         JOIN system_roles sr ON omr.role_id = sr.id
--         WHERE om.user_id = auth.uid() 
--         AND (sr.code = 'super_admin' OR sr.code = 'org_admin')
--         AND om.organization_id = (
--             SELECT organization_id FROM organization_members WHERE id = attendance_records.organization_member_id
--         )
--     )
-- );

-- -- Insert default system roles
-- INSERT INTO system_roles (code, name, description, priority, is_system) VALUES
-- ('super_admin', 'Super Administrator', 'Full system access', 100, true),
-- ('support', 'Support Staff', 'Customer support access', 80, true),
-- ('billing', 'Billing Administrator', 'Billing and subscription management', 70, true),
-- ('org_admin', 'Organization Administrator', 'Full organization access', 60, true),
-- ('org_user', 'Organization User', 'Basic user access', 10, true);

-- -- Insert common device types
-- INSERT INTO device_types (code, name, category) VALUES
-- ('rfid_reader', 'RFID Card Reader', 'rfid'),
-- ('fingerprint', 'Fingerprint Scanner', 'biometric'),
-- ('face_recognition', 'Face Recognition Device', 'biometric'),
-- ('mobile_app', 'Mobile Application', 'mobile'),
-- ('web_app', 'Web Application', 'web'),
-- ('qr_scanner', 'QR Code Scanner', 'qr_code');

-- =============================================
-- 13. FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, first_name, last_name, display_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            CONCAT(NEW.raw_user_meta_data->>'first_name', ' ', NEW.raw_user_meta_data->>'last_name')
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile after auth user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at on all tables that have the column
DO $$ 
DECLARE 
    t text;
BEGIN 
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP 
        EXECUTE format('
            CREATE TRIGGER update_%s_updated_at
                BEFORE UPDATE ON %s
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
            t, t);
    END LOOP;
END;
$$ LANGUAGE plpgsql;