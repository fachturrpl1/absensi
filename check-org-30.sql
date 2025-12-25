-- Query untuk cek jumlah data di ORGANIZATION 30
-- Copy paste ke Supabase SQL Editor

-- 1. Cek total members di organization 30
SELECT 
    COUNT(*) as total_members,
    COUNT(*) FILTER (WHERE is_active = true) as active_members,
    COUNT(*) FILTER (WHERE is_active = false) as inactive_members
FROM organization_members
WHERE organization_id = 30;

-- 2. Cek 20 data pertama untuk sampel (organization 30)
SELECT 
    id,
    organization_id,
    biodata_nik,
    employee_id,
    is_active,
    created_at
FROM organization_members
WHERE organization_id = 30
ORDER BY created_at DESC
LIMIT 20;

-- 3. Cek biometric data untuk organization 30
SELECT 
    COUNT(DISTINCT bd.organization_member_id) as members_with_fingerprint,
    COUNT(bd.id) as total_fingerprint_records
FROM biometric_data bd
JOIN organization_members om ON om.id = bd.organization_member_id
WHERE om.organization_id = 30 
  AND bd.biometric_type = 'FINGERPRINT' 
  AND bd.is_active = true;

-- 4. Cek berapa page data jika ditampilkan per 10 (untuk validasi pagination)
SELECT 
    COUNT(*) as total,
    CEIL(COUNT(*) / 10.0) as total_pages_if_10_per_page,
    CEIL(COUNT(*) / 1000.0) as total_pages_if_1000_per_page
FROM organization_members
WHERE organization_id = 30 AND is_active = true;



