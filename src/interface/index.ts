// Emergency Contact Interface
export interface IEmergencyContact {
    name?: string;
    relationship?: string;
    phone?: string;
    email?: string;
}

export interface IUser {
    id: string;
    employee_code?: string;
    email?: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    display_name?: string | null;
    phone?: string;
    mobile?: string;
    date_of_birth?: string;
    gender?: "male" | "female" | "other" | "prefer_not_to_say" | null;
    nationality?: string;
    national_id?: string;
    profile_photo_url?: string | null;
    emergency_contact?: IEmergencyContact | null;
    is_active?: boolean;
    role_id?: string | null;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string;
}
export interface IOrganization {
    id: string
    code?: string
    name: string
    legal_name?: string
    tax_id?: string
    industry?: string
    size_category?: string
    timezone?: string
    currency_code?: string
    country_code?: string
    address?: string
    city?: string
    state_province?: string
    postal_code?: string // ✅ ubah ke string
    phone?: string       // ✅ ubah ke string
    email?: string
    website?: string
    logo_url?: string | null
    is_active: boolean
    subscription_tier?: string // ✅ perbaikan typo
    time_format?: '12h' | '24h'
    subscription_expires_at?: string | null
    created_at: string
    updated_at?: string
}


// Groups (stored as departments in database)
export interface IGroup {
    id: string;
    organization_id: string;
    parent_department_id?: string;
    code?: string;
    name: string;
    description?: string;
    head_member_id?: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;

    organization?: IOrganization;

}

// Backward compatibility alias
export type IDepartments = IGroup;
export interface IPositions {
    id: string;
    organization_id: string;
    code?: string;
    title: string;
    description?: string;
    level?: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;

    organization?: IOrganization;

}

export interface IOrganization_member {
    id: string;
    organization_id: string;
    user_id: string;
    employee_id?: string;
    department_id?: string; // References group (stored as department in DB)
    position_id?: string;
    direct_manager_id?: string;
    role_id?: string; // Role within the organization (Admin Org or User)
    hire_date: string;
    probation_end_date?: string;
    contract_type?: string;
    employment_status?: string;
    termination_date?: string;
    work_location?: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;

    user?: IUser;
    groups?: IGroup;
    departments?: IGroup;
    positions?: IPositions;
    organization?: IOrganization;
    rfid_cards?: IRfidCard;
    role?: IRole; // Organization role details
}

// Performance data returned for a single member
export interface IMemberPerformance {
    counts: {
        present: number;
        late: number;
        absent: number;
        excused: number;
    };
    lastSeen?: string | null;
    averageWorkDurationMinutes?: number;
    // new insight fields (formatted time strings, e.g. "08:45")
    averageCheckInTime?: string | null;
    averageCheckOutTime?: string | null;
    recent30?: Array<{
        id?: string;
        attendance_date?: string;
        status?: string;
        work_duration_minutes?: number | null;
    }>;
}

// Point data for trend charts
export interface IMemberAttendancePoint {
    date: string; // YYYY-MM-DD
    count: number; // count of attendance records (present) on that date
    averageWorkDurationMinutes?: number | null;
}

export interface IAttendance {
    id: string;
    organization_member_id: string;
    attendance_date: string;
    schedule_shift_id?: string;
    sheduled_start: string;
    sheduled_end: string;
    actual_check_in?: string;
    actual_check_out?: string;
    checkin_device?: string;
    checkout_device?: string;
    checkin_method?: string;
    checkout_method?: string;
    checkin_location?: string;
    checkout_location?: string;
    check_in_photo_url?: string;
    check_out_photo_url?: string;
    work_duration_minutes?: number;
    break_duration_minutes?: number;
    overtime_minutes?: number;
    late_minutes?: number;
    early_leave_minutes?: number;
    status: "present" | "absent" | "late" | "excused";
    validated_status?: "approved" | "rejected" | "pending";
    validated_by?: string;
    validated_at?: string;
    validated_note?: string;
    application_id?: string;
    raw_data?: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
    notes?: string;


    organization_member?: IOrganization_member;
    timezone?: string;
    time_format?: '12h' | '24h';
}

export interface IWorkSchedule {
  id: string;
  organization_id: string;
  code?: string;
  name: string;
  description?: string;
  schedule_type: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  work_schedule_details?: IWorkScheduleDetail[]
}

export interface IWorkScheduleDetail {
    id: string;
    work_schedule_id: number;
    day_of_week: number; 
    is_working_day:boolean;// 0=Sunday, 1=Monday, ..., 6=Saturday

    start_time?: string; // HH:MM:SS
    end_time?: string;   // HH:MM:SS
    break_start:string;
    break_end:string;
    break_duration_minutes?: number;
    flexible_hours: boolean;
    is_active: boolean;
    created_at: string;
    updated_at?: string;    

    work_schedule?: IWorkSchedule;
}

export interface IShift {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  overnight?: boolean;
  break_duration_minutes?: number;
  color_code?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface IShiftAssignment {
  id: string;
  organization_member_id: string;
  shift_id: string;
  assignment_date: string;
  created_by?: string | null;
  created_at?: string;

  organization_member?: IOrganization_member;
  shift?: Pick<IShift, "id" | "code" | "name" | "start_time" | "end_time">;
}

export interface IMemberSchedule{
    id: string;
    organization_member_id: string;
    work_schedule_id: string;

    shift_id?: string;
    effective_date: string;
    end_date?: string | null;
    is_active: boolean;
    created_at: string;
    updated_at?: string;

    organization_member?: IOrganization_member;
    work_schedule?: IWorkSchedule;
}

export interface IRole{
    id:string;
    code?:string;
    name:string;
    description:string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface IPermission {
    id:string;
    code?:string;
    module:string;
    name:string;
    description:string;
}

export interface IRolePermission{
    id:string;
    role_id: number;
  permission_id: string;
    created_at:string;
    role?:IRole;
    permission:IPermission;
}

export interface IUserRole{
    user_id:string;
    role_id:string;

    user:IUser
    role:IRole;
}

export interface IRfidCard{
    id:string;
    organization_member_id:string;
    card_number:string;
    card_type:string;
    issue_date:string;
    organization_member:IOrganization_member;
}

export interface IDeviceType {
    id: string;
    code?: string;
    name: string;
    category: string;
    manufacturer?: string;
    model?: string;
    specifications?: Record<string, unknown>;
    created_at: string;
}

export interface IAttendanceDevice {
    id: string;
    organization_id: string;
    device_type_id: string;
    device_code: string;
    device_name: string;
    serial_number?: string;
    ip_address?: string;
    mac_address?: string;
    location?: string;
    latitude?: string;
    longitude?: string;
    radius_meters?: number;
    firmware_version?: string;
    last_sync_at?: string;
    is_active: boolean;
    configuration?: {
        allow_selfie?: boolean;
        require_location?: boolean;
        max_distance?: number;
        [key: string]: unknown;
    };
    created_at: string;
    updated_at?: string;
    device_types?: IDeviceType;
    organization?: IOrganization;
}

export interface IMemberInvitation {
    id: string;
    organization_id: string;
    email: string;
    invited_by: string;
    role_id?: string;
    department_id?: string;
    position_id?: string;
    phone?: string;
    invitation_token: string;
    status: 'pending' | 'accepted' | 'expired' | 'cancelled';
    message?: string;
    expires_at: string;
    accepted_at?: string;
    created_at: string;
    updated_at?: string;
    
    // Relations (populated via Supabase select)
    organization?: IOrganization;
    inviter?: IUser;
    role?: IRole;
    department?: IDepartments;
    position?: IPositions;
}