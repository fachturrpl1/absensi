-- ============================================================================
-- TIMEZONE FIX MIGRATION
-- ============================================================================
-- Problem: Data attendance tersimpan dengan waktu lokal (WIB) tapi di-treat sebagai UTC
-- Example: 18:15 WIB tersimpan sebagai "18:15 UTC" padahal seharusnya "11:15 UTC"
-- Solution: Subtract 7 hours dari semua timestamp yang > now (future timestamps)
-- ============================================================================

-- BACKUP FIRST (recommended to run manually)
-- CREATE TABLE attendance_logs_backup AS SELECT * FROM attendance_logs;
-- CREATE TABLE attendance_records_backup AS SELECT * FROM attendance_records;

-- Step 1: Fix attendance_logs table
-- Fix event_time yang lebih dari 1 jam ke depan (timezone corrupted data)
UPDATE attendance_logs
SET event_time = event_time - INTERVAL '7 hours'
WHERE event_time > NOW() + INTERVAL '1 hour';

-- Step 2: Fix attendance_records table
-- Fix actual_check_in yang lebih dari 1 jam ke depan
UPDATE attendance_records
SET actual_check_in = actual_check_in - INTERVAL '7 hours'
WHERE actual_check_in > NOW() + INTERVAL '1 hour';

-- Fix actual_check_out yang lebih dari 1 jam ke depan
UPDATE attendance_records
SET actual_check_out = actual_check_out - INTERVAL '7 hours'
WHERE actual_check_out > NOW() + INTERVAL '1 hour';

-- Step 3: Verify the fix
-- Check if there are still future timestamps (should return 0 or very few)
SELECT 
  'attendance_logs' as table_name,
  COUNT(*) as future_records,
  MAX(event_time) as max_future_time
FROM attendance_logs
WHERE event_time > NOW() + INTERVAL '1 hour'
UNION ALL
SELECT 
  'attendance_records (check_in)' as table_name,
  COUNT(*) as future_records,
  MAX(actual_check_in) as max_future_time
FROM attendance_records
WHERE actual_check_in > NOW() + INTERVAL '1 hour'
UNION ALL
SELECT 
  'attendance_records (check_out)' as table_name,
  COUNT(*) as future_records,
  MAX(actual_check_out) as max_future_time
FROM attendance_records
WHERE actual_check_out > NOW() + INTERVAL '1 hour';

-- ============================================================================
-- NOTES:
-- 1. Run this migration during low-traffic hours
-- 2. Create backups before running (uncomment backup queries above)
-- 3. The -7 hours adjustment is for WIB (UTC+7) timezone
-- 4. Adjust the interval if your timezone is different
-- 5. After migration, all new data will be stored correctly via toTimestampWithTimezone()
-- ============================================================================
