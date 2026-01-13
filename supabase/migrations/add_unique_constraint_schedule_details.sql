-- Migration: Add unique constraint for work_schedule_details upsert
-- Required for upsert with onConflict: 'work_schedule_id,day_of_week' to work correctly
-- Date: 2026-01-13

-- First, remove any duplicate rows (keep the latest one based on id)
DELETE FROM work_schedule_details a
USING work_schedule_details b
WHERE a.id < b.id
  AND a.work_schedule_id = b.work_schedule_id
  AND a.day_of_week = b.day_of_week;

-- Add unique constraint
ALTER TABLE work_schedule_details
  DROP CONSTRAINT IF EXISTS uq_work_schedule_day;
  
ALTER TABLE work_schedule_details
  ADD CONSTRAINT uq_work_schedule_day 
  UNIQUE (work_schedule_id, day_of_week);
