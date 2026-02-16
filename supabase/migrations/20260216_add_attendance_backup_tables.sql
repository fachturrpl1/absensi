-- Migration to add 'applications' and 'device' tables from attendance.sql backup
-- and link them to attendance records/logs.

-- 1. Create Applications Table
CREATE TABLE IF NOT EXISTS applications (
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

-- 2. Create Device Management Tables
CREATE TABLE IF NOT EXISTS device_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    specifications JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_devices (
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

CREATE TABLE IF NOT EXISTS biometric_data (
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

CREATE TABLE IF NOT EXISTS rfid_cards (
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

-- 3. Add Columns to Attendance Records
DO $$ 
BEGIN 
    -- Application ID
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance_records' AND column_name = 'application_id') THEN
        ALTER TABLE attendance_records ADD COLUMN application_id INT REFERENCES applications(id);
    END IF;

    -- Device IDs
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance_records' AND column_name = 'check_in_device_id') THEN
        ALTER TABLE attendance_records ADD COLUMN check_in_device_id INT REFERENCES attendance_devices(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance_records' AND column_name = 'check_out_device_id') THEN
        ALTER TABLE attendance_records ADD COLUMN check_out_device_id INT REFERENCES attendance_devices(id);
    END IF;
END $$;

-- 4. Add Columns to Attendance Logs
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance_logs' AND column_name = 'application_id') THEN
        ALTER TABLE attendance_logs ADD COLUMN application_id INT REFERENCES applications(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance_logs' AND column_name = 'device_id') THEN
        ALTER TABLE attendance_logs ADD COLUMN device_id INT REFERENCES attendance_devices(id);
    END IF;
END $$;

-- 5. Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfid_cards ENABLE ROW LEVEL SECURITY;
