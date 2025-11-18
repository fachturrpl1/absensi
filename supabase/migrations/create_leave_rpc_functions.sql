-- ============================================
-- Leave Management RPC Functions
-- Created: 2025-11-18
-- Purpose: Support leave balance updates and approval workflow
-- ============================================

-- ============================================
-- 1. Update Leave Balance Pending Days
-- ============================================
-- Purpose: Add or subtract pending days when leave request is created or cancelled
-- Parameters:
--   p_member_id: Organization member ID
--   p_leave_type_id: Leave type ID
--   p_year: Year
--   p_days: Number of days to add/subtract
--   p_operation: 'add' or 'subtract'

CREATE OR REPLACE FUNCTION update_leave_balance_pending(
  p_member_id INTEGER,
  p_leave_type_id INTEGER,
  p_year INTEGER,
  p_days NUMERIC,
  p_operation TEXT
) RETURNS VOID AS $$
BEGIN
  IF p_operation = 'add' THEN
    -- Add to pending, subtract from remaining
    UPDATE leave_balances
    SET 
      pending_days = pending_days + p_days,
      remaining_days = remaining_days - p_days,
      updated_at = NOW()
    WHERE organization_member_id = p_member_id
      AND leave_type_id = p_leave_type_id
      AND year = p_year;
      
    -- Create balance record if doesn't exist
    IF NOT FOUND THEN
      INSERT INTO leave_balances (
        organization_member_id,
        leave_type_id,
        year,
        entitled_days,
        carried_forward_days,
        used_days,
        pending_days,
        remaining_days,
        created_at,
        updated_at
      )
      SELECT
        p_member_id,
        p_leave_type_id,
        p_year,
        lt.days_per_year,
        0,
        0,
        p_days,
        GREATEST(lt.days_per_year - p_days, 0),
        NOW(),
        NOW()
      FROM leave_types lt
      WHERE lt.id = p_leave_type_id;
    END IF;
  ELSE
    -- Subtract from pending, add to remaining
    UPDATE leave_balances
    SET 
      pending_days = GREATEST(pending_days - p_days, 0),
      remaining_days = remaining_days + p_days,
      updated_at = NOW()
    WHERE organization_member_id = p_member_id
      AND leave_type_id = p_leave_type_id
      AND year = p_year;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. Approve Leave Balance
-- ============================================
-- Purpose: Move days from pending to used when leave is approved
-- Parameters:
--   p_member_id: Organization member ID
--   p_leave_type_id: Leave type ID
--   p_year: Year
--   p_days: Number of days to approve

CREATE OR REPLACE FUNCTION approve_leave_balance(
  p_member_id INTEGER,
  p_leave_type_id INTEGER,
  p_year INTEGER,
  p_days NUMERIC
) RETURNS VOID AS $$
BEGIN
  UPDATE leave_balances
  SET 
    pending_days = GREATEST(pending_days - p_days, 0),
    used_days = used_days + p_days,
    updated_at = NOW()
  WHERE organization_member_id = p_member_id
    AND leave_type_id = p_leave_type_id
    AND year = p_year;
    
  -- Ensure balance exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Leave balance not found for member % and leave type %', p_member_id, p_leave_type_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. Update Leave Balances Entitled Days
-- ============================================
-- Purpose: Update entitled days when leave type days_per_year is changed
-- Parameters:
--   p_leave_type_id: Leave type ID
--   p_year: Year
--   p_new_entitled: New entitled days value

CREATE OR REPLACE FUNCTION update_leave_balances_entitled(
  p_leave_type_id INTEGER,
  p_year INTEGER,
  p_new_entitled NUMERIC
) RETURNS VOID AS $$
BEGIN
  UPDATE leave_balances
  SET 
    entitled_days = p_new_entitled,
    remaining_days = p_new_entitled + carried_forward_days - used_days - pending_days,
    updated_at = NOW()
  WHERE leave_type_id = p_leave_type_id
    AND year = p_year;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Initialize Leave Balances for New Member
-- ============================================
-- Purpose: Create leave balance records for all active leave types when new member joins
-- Parameters:
--   p_member_id: Organization member ID
--   p_organization_id: Organization ID
--   p_year: Year (optional, defaults to current year)

CREATE OR REPLACE FUNCTION initialize_leave_balances(
  p_member_id INTEGER,
  p_organization_id INTEGER,
  p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
) RETURNS VOID AS $$
BEGIN
  INSERT INTO leave_balances (
    organization_member_id,
    leave_type_id,
    year,
    entitled_days,
    carried_forward_days,
    used_days,
    pending_days,
    remaining_days,
    created_at,
    updated_at
  )
  SELECT
    p_member_id,
    lt.id,
    p_year,
    lt.days_per_year,
    0,
    0,
    0,
    lt.days_per_year,
    NOW(),
    NOW()
  FROM leave_types lt
  WHERE lt.organization_id = p_organization_id
    AND lt.is_active = true
    AND lt.days_per_year > 0
  ON CONFLICT (organization_member_id, leave_type_id, year) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. Carry Forward Leave Balances
-- ============================================
-- Purpose: Carry forward unused leave days to next year (run at year end)
-- Parameters:
--   p_organization_id: Organization ID
--   p_from_year: Year to carry forward from
--   p_to_year: Year to carry forward to

CREATE OR REPLACE FUNCTION carry_forward_leave_balances(
  p_organization_id INTEGER,
  p_from_year INTEGER,
  p_to_year INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Insert new year balances with carried forward days
  INSERT INTO leave_balances (
    organization_member_id,
    leave_type_id,
    year,
    entitled_days,
    carried_forward_days,
    used_days,
    pending_days,
    remaining_days,
    created_at,
    updated_at
  )
  SELECT
    lb.organization_member_id,
    lb.leave_type_id,
    p_to_year,
    lt.days_per_year,
    CASE 
      WHEN lt.carry_forward_allowed THEN 
        LEAST(lb.remaining_days, COALESCE(lt.max_carry_forward_days, lb.remaining_days))
      ELSE 0
    END,
    0,
    0,
    lt.days_per_year + CASE 
      WHEN lt.carry_forward_allowed THEN 
        LEAST(lb.remaining_days, COALESCE(lt.max_carry_forward_days, lb.remaining_days))
      ELSE 0
    END,
    NOW(),
    NOW()
  FROM leave_balances lb
  JOIN leave_types lt ON lb.leave_type_id = lt.id
  JOIN organization_members om ON lb.organization_member_id = om.id
  WHERE om.organization_id = p_organization_id
    AND lb.year = p_from_year
    AND lt.is_active = true
    AND om.is_active = true
  ON CONFLICT (organization_member_id, leave_type_id, year) DO NOTHING;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. Get Leave Statistics for Organization
-- ============================================
-- Purpose: Get comprehensive leave statistics for dashboard
-- Parameters:
--   p_organization_id: Organization ID
--   p_year: Year (optional, defaults to current year)

CREATE OR REPLACE FUNCTION get_leave_statistics(
  p_organization_id INTEGER,
  p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_requests', (
      SELECT COUNT(*)
      FROM leave_requests lr
      JOIN organization_members om ON lr.organization_member_id = om.id
      WHERE om.organization_id = p_organization_id
        AND EXTRACT(YEAR FROM lr.requested_at) = p_year
    ),
    'pending_requests', (
      SELECT COUNT(*)
      FROM leave_requests lr
      JOIN organization_members om ON lr.organization_member_id = om.id
      WHERE om.organization_id = p_organization_id
        AND lr.status = 'pending'
        AND EXTRACT(YEAR FROM lr.requested_at) = p_year
    ),
    'approved_requests', (
      SELECT COUNT(*)
      FROM leave_requests lr
      JOIN organization_members om ON lr.organization_member_id = om.id
      WHERE om.organization_id = p_organization_id
        AND lr.status = 'approved'
        AND EXTRACT(YEAR FROM lr.requested_at) = p_year
    ),
    'rejected_requests', (
      SELECT COUNT(*)
      FROM leave_requests lr
      JOIN organization_members om ON lr.organization_member_id = om.id
      WHERE om.organization_id = p_organization_id
        AND lr.status = 'rejected'
        AND EXTRACT(YEAR FROM lr.requested_at) = p_year
    ),
    'total_leave_days', (
      SELECT COALESCE(SUM(lr.total_days), 0)
      FROM leave_requests lr
      JOIN organization_members om ON lr.organization_member_id = om.id
      WHERE om.organization_id = p_organization_id
        AND lr.status = 'approved'
        AND EXTRACT(YEAR FROM lr.requested_at) = p_year
    ),
    'employees_on_leave_today', (
      SELECT COUNT(DISTINCT lr.organization_member_id)
      FROM leave_requests lr
      JOIN organization_members om ON lr.organization_member_id = om.id
      WHERE om.organization_id = p_organization_id
        AND lr.status = 'approved'
        AND CURRENT_DATE BETWEEN lr.start_date AND lr.end_date
    ),
    'upcoming_leaves_30_days', (
      SELECT COUNT(*)
      FROM leave_requests lr
      JOIN organization_members om ON lr.organization_member_id = om.id
      WHERE om.organization_id = p_organization_id
        AND lr.status = 'approved'
        AND lr.start_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Grant Execute Permissions
-- ============================================

-- Grant to authenticated users (adjust based on your RLS policies)
GRANT EXECUTE ON FUNCTION update_leave_balance_pending TO authenticated;
GRANT EXECUTE ON FUNCTION approve_leave_balance TO authenticated;
GRANT EXECUTE ON FUNCTION update_leave_balances_entitled TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_leave_balances TO authenticated;
GRANT EXECUTE ON FUNCTION carry_forward_leave_balances TO authenticated;
GRANT EXECUTE ON FUNCTION get_leave_statistics TO authenticated;

-- ============================================
-- Comments
-- ============================================

COMMENT ON FUNCTION update_leave_balance_pending IS 'Update pending days in leave balance when request is created or cancelled';
COMMENT ON FUNCTION approve_leave_balance IS 'Move days from pending to used when leave request is approved';
COMMENT ON FUNCTION update_leave_balances_entitled IS 'Update entitled days when leave type configuration changes';
COMMENT ON FUNCTION initialize_leave_balances IS 'Create initial leave balance records for new organization member';
COMMENT ON FUNCTION carry_forward_leave_balances IS 'Carry forward unused leave days to next year (year-end process)';
COMMENT ON FUNCTION get_leave_statistics IS 'Get comprehensive leave statistics for organization dashboard';
