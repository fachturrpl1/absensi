'use server'

import { createClient } from '@/utils/supabase/server'

const BUCKET_NAME = 'screenshots'
const INTERVAL_SECONDS = 600 // 10 menit = 600 detik

// ============================================================
// Types
// ============================================================

export interface IScreenshot {
    id: number
    organization_member_id: number
    project_id: number | null
    task_id: number | null
    activity_id: number | null
    screenshot_date: string
    time_slot: string
    recorded_at: string
    full_url: string
    thumb_url: string | null
    screen_number: number
    width: number | null
    height: number | null
    is_blurred: boolean
    is_deleted: boolean
    created_at: string
}

export interface IScreenshotWithActivity extends IScreenshot {
    // Dari join activities
    keyboard_seconds: number | null
    mouse_seconds: number | null
    // Computed
    activity_progress: number // 0-100
}

export interface ISimpleMember {
    id: string          // organization_member id (sebagai string)
    name: string
    avatarUrl: string | null
}

export interface UploadScreenshotParams {
    orgId: string
    memberId: number
    file: File | Blob
    thumbFile?: File | Blob | null
    projectId?: number | null
    taskId?: number | null
    activityId?: number | null
    screenshotDate: string       // format: YYYY-MM-DD
    timeSlot: string             // format: ISO timestamp
    recordedAt: string           // format: ISO timestamp
    screenNumber?: number
    width?: number
    height?: number
}

// ============================================================
// Upload screenshot ke Supabase Storage + simpan ke DB
// ============================================================

export async function uploadScreenshot(params: UploadScreenshotParams): Promise<{
    success: boolean
    data?: IScreenshot
    message?: string
}> {
    const supabase = await createClient()

    const {
        orgId,
        memberId,
        file,
        thumbFile,
        projectId,
        taskId,
        activityId,
        screenshotDate,
        timeSlot,
        recordedAt,
        screenNumber = 1,
        width,
        height,
    } = params

    const timestamp = Date.now()
    const basePath = `${orgId}/${memberId}/${screenshotDate}`

    // --- Upload full screenshot ---
    const fullPath = `${basePath}/full_${timestamp}_screen${screenNumber}.jpg`
    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fullPath, file, {
            contentType: 'image/jpeg',
            upsert: false,
        })

    if (uploadError) {
        console.error('Upload full screenshot failed:', uploadError)
        return { success: false, message: uploadError.message }
    }

    const { data: { publicUrl: fullUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fullPath)

    // --- Upload thumbnail (optional) ---
    let thumbUrl: string | null = null
    if (thumbFile) {
        const thumbPath = `${basePath}/thumb_${timestamp}_screen${screenNumber}.jpg`
        const { error: thumbError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(thumbPath, thumbFile, {
                contentType: 'image/jpeg',
                upsert: false,
            })

        if (!thumbError) {
            const { data: { publicUrl } } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(thumbPath)
            thumbUrl = publicUrl
        }
    }

    // --- Simpan ke tabel screenshots ---
    const { data, error: dbError } = await supabase
        .from('screenshots')
        .insert({
            organization_member_id: memberId,
            project_id: projectId ?? null,
            task_id: taskId ?? null,
            activity_id: activityId ?? null,
            screenshot_date: screenshotDate,
            time_slot: timeSlot,
            recorded_at: recordedAt,
            full_url: fullUrl,
            thumb_url: thumbUrl,
            screen_number: screenNumber,
            width: width ?? null,
            height: height ?? null,
            is_blurred: false,
            is_deleted: false,
        })
        .select()
        .single()

    if (dbError) {
        console.error('Insert screenshot to DB failed:', dbError)
        return { success: false, message: dbError.message }
    }

    return { success: true, data }
}

// ============================================================
// Ambil screenshots berdasarkan member & range tanggal
// Sekaligus join activities untuk activity_progress
// ============================================================

export async function getScreenshotsByMemberAndDate(
    organizationMemberId: number,
    startDate: string,   // YYYY-MM-DD
    endDate: string      // YYYY-MM-DD
): Promise<{ success: boolean; data?: IScreenshotWithActivity[]; message?: string }> {
    const supabase = await createClient()

    // Fetch screenshots + join activity untuk keyboard/mouse seconds
    const { data, error } = await supabase
        .from('screenshots')
        .select(`
      *,
      activities (
        keyboard_seconds,
        mouse_seconds
      )
    `)
        .eq('organization_member_id', organizationMemberId)
        .gte('screenshot_date', startDate)
        .lte('screenshot_date', endDate)
        .eq('is_deleted', false)
        .order('time_slot', { ascending: true })

    if (error) {
        return { success: false, message: error.message }
    }

    // Hitung activity_progress dari keyboard_seconds + mouse_seconds
    const mapped: IScreenshotWithActivity[] = (data ?? []).map((row: any) => {
        const kbd = row.activities?.keyboard_seconds ?? 0
        const mouse = row.activities?.mouse_seconds ?? 0
        const totalActive = kbd + mouse
        // Max active = INTERVAL_SECONDS (600s untuk 10 menit)
        const progress = Math.min(100, Math.round((totalActive / INTERVAL_SECONDS) * 100))

        return {
            ...row,
            keyboard_seconds: kbd,
            mouse_seconds: mouse,
            activity_progress: progress,
        }
    })

    return { success: true, data: mapped }
}

// ============================================================
// Ambil daftar member untuk dropdown (screenshot page)
// ============================================================

export async function getMembersForScreenshot(
    organizationId: string
): Promise<{ success: boolean; data?: ISimpleMember[]; message?: string }> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('organization_members')
        .select(`
      id,
      user_profiles:user_id (
        first_name,
        last_name,
        display_name,
        profile_photo_url
      )
    `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('id', { ascending: true })

    if (error) {
        return { success: false, message: error.message }
    }

    const members: ISimpleMember[] = (data ?? []).map((m: any) => {
        const profile = m.user_profiles
        const firstName = profile?.first_name ?? ''
        const lastName = profile?.last_name ?? ''
        const fullName = `${firstName} ${lastName}`.trim() || profile?.display_name || 'Unknown Member'
        return {
            id: String(m.id),
            name: fullName,
            avatarUrl: profile?.profile_photo_url ?? null,
        }
    })

    return { success: true, data: members }
}

// ============================================================
// Soft delete screenshot
// ============================================================

export async function deleteScreenshot(
    screenshotId: number,
    deletedBy: string
): Promise<{ success: boolean; message?: string }> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('screenshots')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_by: deletedBy,
        })
        .eq('id', screenshotId)

    if (error) {
        return { success: false, message: error.message }
    }

    return { success: true }
}

// ============================================================
// Generate signed URL (untuk bucket private - expire 1 jam)
// ============================================================

export async function getSignedUrl(
    filePath: string,
    expiresInSeconds = 3600
): Promise<{ success: boolean; signedUrl?: string; message?: string }> {
    const supabase = await createClient()

    const storagePath = filePath.includes('/storage/v1/object/')
        ? filePath.split(`/${BUCKET_NAME}/`)[1]
        : filePath

    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(storagePath ?? '', expiresInSeconds)

    if (error) {
        return { success: false, message: error.message }
    }

    return { success: true, signedUrl: data.signedUrl }
}
