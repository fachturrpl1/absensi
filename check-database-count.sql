-- Query untuk cek jumlah data di database
-- Copy paste ke Supabase SQL Editor

-- 1. Cek total members per organization
SELECT 
    organization_id,
    COUNT(*) as total_members,
    COUNT(*) FILTER (WHERE is_active = true) as active_members,
    COUNT(*) FILTER (WHERE is_active = false) as inactive_members
FROM organization_members
GROUP BY organization_id
ORDER BY organization_id;

-- 2. Cek detail members (10 data pertama untuk sampel)
SELECT 
    id,
    organization_id,
    user_id,
    biodata_nik,
    employee_id,
    is_active,
    created_at
FROM organization_members
WHERE organization_id = 1 -- Ganti dengan organization_id Anda
ORDER BY created_at DESC
LIMIT 10;

-- 3. Cek total biometric data (fingerprint)
SELECT 
    om.organization_id,
    COUNT(DISTINCT bd.organization_member_id) as members_with_fingerprint,
    COUNT(bd.id) as total_fingerprint_records
FROM biometric_data bd
JOIN organization_members om ON om.id = bd.organization_member_id
WHERE bd.biometric_type = 'FINGERPRINT' AND bd.is_active = true
GROUP BY om.organization_id;



