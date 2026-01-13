-- Migration: Add grace_in_minutes and grace_out_minutes to work_schedule_details
-- Date: 2026-01-13

-- Add grace period columns
ALTER TABLE work_schedule_details
  ADD COLUMN IF NOT EXISTS grace_in_minutes INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grace_out_minutes INT NOT NULL DEFAULT 0;

-- Add validation constraints
-- Constraint: core_hours_start must be before core_hours_end
ALTER TABLE work_schedule_details
  DROP CONSTRAINT IF EXISTS chk_core_hours_order;
ALTER TABLE work_schedule_details
  ADD CONSTRAINT chk_core_hours_order 
    CHECK (core_hours_start IS NULL OR core_hours_end IS NULL OR core_hours_start < core_hours_end);

-- Constraint: start_time (check-in) must be before core_hours_start
ALTER TABLE work_schedule_details
  DROP CONSTRAINT IF EXISTS chk_start_before_core;
ALTER TABLE work_schedule_details
  ADD CONSTRAINT chk_start_before_core 
    CHECK (start_time IS NULL OR core_hours_start IS NULL OR start_time < core_hours_start);

-- Constraint: end_time (check-out) must be after core_hours_end
ALTER TABLE work_schedule_details
  DROP CONSTRAINT IF EXISTS chk_end_after_core;
ALTER TABLE work_schedule_details
  ADD CONSTRAINT chk_end_after_core 
    CHECK (end_time IS NULL OR core_hours_end IS NULL OR end_time > core_hours_end);
