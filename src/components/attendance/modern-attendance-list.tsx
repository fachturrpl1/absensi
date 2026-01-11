'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { DateFilterBar, DateFilterState } from '@/components/analytics/date-filter-bar';
import {
  Search,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Timer,
  Edit,
  Trash2,
  Grid3x3,
  RotateCcw,
  Plus,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatInTimeZone } from 'date-fns-tz';
import { formatLocalTime } from '@/utils/timezone';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { getAllAttendance, deleteAttendanceRecord, deleteMultipleAttendanceRecords, updateAttendanceRecord, AttendanceListItem, GetAttendanceResult } from '@/action/attendance';
import { toast } from 'sonner';
import { useOrgStore } from '@/store/org-store';
import { createClient } from '@/utils/supabase/client';
import { toTimestampWithTimezone } from '@/lib/timezone';
import { PaginationFooter } from '@/components/pagination-footer';

type AttendanceChangeRow = { attendance_date?: string | null; organization_member_id?: number | null; organization_id?: number | null };
type PgChange<T> = { new: T | null; old: T | null };

interface ModernAttendanceListProps {
  initialData?: AttendanceListItem[];
  initialStats?: unknown;
  initialMeta?: { total?: number; totalPages?: number; tz?: string };
}

export default function ModernAttendanceList({ initialData: _initialData, initialStats: _initialStats, initialMeta }: ModernAttendanceListProps) {
  const orgStore = useOrgStore();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [attendanceData, setAttendanceData] = useState<AttendanceListItem[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [userTimezone, setUserTimezone] = useState('UTC');
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);

  // Date filter state (same as Dashboard)
  const [dateRange, setDateRange] = useState<DateFilterState>({
    from: new Date(),
    to: new Date(),
    preset: 'today',
  });

  // Initialize date range after hydration
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    setDateRange({
      from: today,
      to: endOfToday,
      preset: 'today',
    });

    // Set selected org from store
    if (orgStore.organizationId) {
      setSelectedOrgId(orgStore.organizationId);
    }
  }, [orgStore.organizationId]);

  // Fallback: resolve organizationId from cookie in production if store not ready yet
  useEffect(() => {
    if (selectedOrgId || orgStore.organizationId) return;
    try {
      const m = document.cookie.match(/(?:^|; )org_id=(\d+)/);
      if (m && m[1]) {
        const oid = Number(m[1]);
        if (!Number.isNaN(oid)) setSelectedOrgId(oid);
      }
    } catch { }
  }, [selectedOrgId, orgStore.organizationId]);


  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRecords, setEditingRecords] = useState<AttendanceListItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [realtimeActive, setRealtimeActive] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const realtimeDebounceRef = useRef<number | null>(null);
  const latestRequestRef = useRef(0);
  const pendingIdsRef = useRef<Set<number>>(new Set());
  const flushTimerRef = useRef<number | null>(null);
  const fetchDataRef = useRef<() => void>(() => { });

  // Helper to map a joined row into AttendanceListItem
  const mapRowToItem = useCallback((data: any): AttendanceListItem => {
    type MemberProfile = { first_name: string | null; last_name: string | null; display_name: string | null; email: string | null; profile_photo_url: string | null; search_name: string | null };
    type Biodata = { nama: string | null; nickname: string | null };
    type MemberData = { id: number; user_profiles: MemberProfile | MemberProfile[] | null; departments: { name: string | null } | { name: string | null }[] | null; biodata?: Biodata | Biodata[] | null };
    const mRel = (data as any).organization_members as MemberData | MemberData[] | null;
    const mObj: MemberData | null = Array.isArray(mRel) ? (mRel[0] as MemberData) : (mRel as MemberData);
    const profileObj = mObj?.user_profiles;
    const profile: MemberProfile | null = Array.isArray(profileObj) ? (profileObj[0] ?? null) : (profileObj ?? null);
    const biodataObj = mObj?.biodata;
    const biodata: Biodata | null = Array.isArray(biodataObj) ? (biodataObj[0] ?? null) : (biodataObj ?? null);

    // Try user_profiles first
    const displayName = (profile?.display_name ?? '').trim();
    const firstName = profile?.first_name ?? '';
    const lastName = profile?.last_name ?? '';
    const email = (profile?.email ?? '').trim();
    const fullName = `${firstName} ${lastName}`.trim();

    // Fallback to biodata if user_profiles has no name
    const biodataNama = (biodata?.nama ?? '').trim();
    const biodataNickname = (biodata?.nickname ?? '').trim();

    const effectiveName = displayName || fullName || email || (profile?.search_name ?? '') || biodataNama || biodataNickname;
    const deptObj = mObj?.departments;
    const departmentName = Array.isArray(deptObj) ? (deptObj[0]?.name ?? '') : (deptObj?.name ?? '');

    return {
      id: String(data.id),
      member: {
        id: data.organization_member_id,
        name: effectiveName || `Member #${data.organization_member_id}`,
        avatar: profile?.profile_photo_url || undefined,
        position: '',
        department: departmentName,
      },
      date: data.attendance_date,
      checkIn: data.actual_check_in,
      checkOut: data.actual_check_out,
      workHours: data.work_duration_minutes ? `${Math.floor((data.work_duration_minutes as number) / 60)}h ${(data.work_duration_minutes as number) % 60}m` : (data.actual_check_in ? '-' : '-'),
      status: data.status,
      checkInMethod: (data as any).check_in_method
        ? String((data as any).check_in_method)
        : (data.actual_check_in ? 'manual' : null),
      checkOutMethod: (data as any).check_out_method
        ? String((data as any).check_out_method)
        : (data.actual_check_out ? 'manual' : null),
      checkInLocationName: null,
      checkOutLocationName: null,
      notes: '',
      timezone: userTimezone || 'Asia/Jakarta',
      time_format: '24h',
    };
  }, [userTimezone]);

  interface MethodDisplayProps {
    checkInMethod?: string | null;
    checkOutMethod?: string | null;
  }
  const MethodDisplay = ({ checkInMethod, checkOutMethod }: MethodDisplayProps) => {
    const fmt = (s?: string | null) => {
      if (!s) return 'None';
      return String(s)
        .toLowerCase()
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    };
    const inMethod = fmt(checkInMethod);
    const outMethod = fmt(checkOutMethod);
    return (
      <div className="flex flex-col gap-1 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">IN:</span>
          <span className="font-medium">{inMethod}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">OUT:</span>
          <span className="font-medium">{outMethod}</span>
        </div>
      </div>
    );
  };

  // Fetch a single record by id (client-side) and merge into state
  const fetchAndMergeRecord = useCallback(async (recId: number) => {
    try {
      const supabase = createClient();
      const listRel = 'organization_members!inner(id, organization_id, is_active, user_profiles!organization_members_user_id_fkey(first_name,last_name,display_name,email,profile_photo_url,search_name), departments!organization_members_department_id_fkey(name))';
      const { data } = await supabase
        .from('attendance_records')
        .select(`id, organization_member_id, attendance_date, actual_check_in, actual_check_out, status, created_at, work_duration_minutes, check_in_method, check_out_method, ${listRel}`)
        .eq('id', recId)
        .maybeSingle();
      if (!data) return;
      // Guard: skip if record org doesn't match current org or date outside current range
      try {
        const mRel = (data as any).organization_members as any;
        const mObj = Array.isArray(mRel) ? mRel[0] : mRel;
        const recOrgId = mObj?.organization_id;
        const currentOrgId = selectedOrgId || orgStore.organizationId;
        if (currentOrgId && recOrgId && Number(recOrgId) !== Number(currentOrgId)) {
          return;
        }
        const recDateStr = String((data as any).attendance_date || '').slice(0, 10);
        const fromStr = toLocalYMD(dateRange.from);
        const toStr = toLocalYMD(dateRange.to);
        if (recDateStr && (recDateStr < fromStr || recDateStr > toStr)) {
          return;
        }
      } catch { }
      const mapped: AttendanceListItem = mapRowToItem(data);

      setAttendanceData((prev) => {
        const without = prev.filter((r) => r.id !== mapped.id);
        const next = [mapped, ...without];
        return next;
      });
      setTotalItems((t) => Math.max(t, 1));
    } catch {
      // fallback to full fetch on any error
      fetchDataRef.current();
    }
  }, [mapRowToItem]);

  // Fetch and merge multiple records by ids (batch)
  const fetchAndMergeMany = useCallback(async (recIds: number[]) => {
    if (!recIds || recIds.length === 0) return;
    try {
      const supabase = createClient();
      const listRel = 'organization_members!inner(id, organization_id, is_active, user_profiles!organization_members_user_id_fkey(first_name,last_name,display_name,email,profile_photo_url,search_name), departments!organization_members_department_id_fkey(name))';
      const { data } = await supabase
        .from('attendance_records')
        .select(`id, organization_member_id, attendance_date, actual_check_in, actual_check_out, status, created_at, work_duration_minutes, check_in_method, check_out_method, ${listRel}`)
        .in('id', recIds);
      if (!Array.isArray(data) || data.length === 0) return;

      // Filter only rows belonging to current org and within date range
      const currentOrgId = selectedOrgId || orgStore.organizationId;
      const fromStr = toLocalYMD(dateRange.from);
      const toStr = toLocalYMD(dateRange.to);
      const safeRows = (data as any[]).filter((row) => {
        try {
          const mRel = (row as any).organization_members as any;
          const mObj = Array.isArray(mRel) ? mRel[0] : mRel;
          const recOrgId = mObj?.organization_id;
          if (currentOrgId && recOrgId && Number(recOrgId) !== Number(currentOrgId)) return false;
          const recDateStr = String((row as any).attendance_date || '').slice(0, 10);
          if (recDateStr && (recDateStr < fromStr || recDateStr > toStr)) return false;
          return true;
        } catch { return false; }
      });
      if (safeRows.length === 0) return;

      const mapped = safeRows.map(mapRowToItem);
      setAttendanceData((prev) => {
        const map = new Map(prev.map((r) => [r.id, r] as const));
        for (const m of mapped) map.set(m.id, m);
        const next = Array.from(map.values());
        return next;
      });
      setTotalItems((t) => Math.max(t, mapped.length));
    } catch {
      fetchDataRef.current();
    }
  }, [mapRowToItem]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const initialsFromName = useCallback((name: string): string => {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const second = parts[1]?.[0] ?? '';
    return (first + second).toUpperCase();
  }, []);

  // Helper to convert Date to local YYYY-MM-DD string
  const toLocalYMD = useCallback((d: Date) => {
    const dt = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return dt.toISOString().slice(0, 10);
  }, []);

  // Helper to convert Date to YYYY-MM-DD in organization timezone
  const toOrgYMD = useCallback((d: Date) => {
    // If org timezone isn't known yet (defaults to 'UTC'), use browser-local date to prevent off-by-one day
    if (!userTimezone || userTimezone === 'UTC') {
      const dt = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      return dt.toISOString().slice(0, 10);
    }
    try {
      return formatInTimeZone(d, userTimezone, 'yyyy-MM-dd');
    } catch {
      const dt = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      return dt.toISOString().slice(0, 10);
    }
  }, [userTimezone]);

  // Local helpers for building/formatting date/time
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const toLocalHM = useCallback((d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`, []);
  const buildDateTime = useCallback((dateStr: string, timeStr: string): Date => {
    const [yStr = '', mStr = '', dStr = ''] = (dateStr ?? '').split('-');
    const [hhStr = '', mmStr = ''] = (timeStr ?? '').split(':');
    const now = new Date();
    const y = Number.isFinite(Number(yStr)) && yStr !== '' ? Number(yStr) : now.getFullYear();
    const m = Number.isFinite(Number(mStr)) && mStr !== '' ? Number(mStr) : 1;
    const d = Number.isFinite(Number(dStr)) && dStr !== '' ? Number(dStr) : 1;
    const hh = Number.isFinite(Number(hhStr)) && hhStr !== '' ? Number(hhStr) : 0;
    const mm = Number.isFinite(Number(mmStr)) && mmStr !== '' ? Number(mmStr) : 0;
    return new Date(y, m - 1, d, hh, mm, 0, 0);
  }, []);

  const cacheKeyBase = React.useMemo(() => {
    const orgId = selectedOrgId || orgStore.organizationId || 'no-org';
    // Use org timezone if known; otherwise fallback to browser-local date to avoid UTC day shift
    const toLocal = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const effFrom = (userTimezone && userTimezone !== 'UTC') ? formatInTimeZone(dateRange.from, userTimezone, 'yyyy-MM-dd') : toLocal(dateRange.from);
    const effTo = (userTimezone && userTimezone !== 'UTC') ? formatInTimeZone(dateRange.to, userTimezone, 'yyyy-MM-dd') : toLocal(dateRange.to);
    const status = statusFilter || 'all';
    const dept = departmentFilter || 'all';
    const q = searchQuery || '';
    return `attendance:list:${orgId}:p=${currentPage}:l=${itemsPerPage}:from=${effFrom}:to=${effTo}:status=${status}:dept=${dept}:q=${q}`;
  }, [selectedOrgId, orgStore.organizationId, currentPage, itemsPerPage, dateRange.from, dateRange.to, statusFilter, departmentFilter, searchQuery, userTimezone]);

  // Ensure organization id is resolved before hydrating any cached UI
  const orgResolved = Boolean(selectedOrgId || orgStore.organizationId);

  // Hydrate loading state from localStorage for current key (ignore stale >15s)
  useEffect(() => {
    if (!isMounted || !orgResolved) return;
    try {
      const raw = localStorage.getItem(`${cacheKeyBase}:loading`);
      const cachedDataRaw = localStorage.getItem(cacheKeyBase);
      if (raw) {
        const parsed = JSON.parse(raw) as { loading?: boolean; ts?: number };
        const tooOld = parsed.ts ? (Date.now() - parsed.ts > 15_000) : true;
        if (!tooOld && parsed.loading === false && cachedDataRaw) {
          setLoading(false);
        }
      }
    } catch { }
  }, [cacheKeyBase, isMounted, orgResolved]);

  // Persist loading state on change
  useEffect(() => {
    if (!isMounted) return;
    try {
      if (loading) {
        localStorage.setItem(`${cacheKeyBase}:loading`, JSON.stringify({ loading: true, ts: Date.now() }));
      } else {
        localStorage.removeItem(`${cacheKeyBase}:loading`);
      }
    } catch { }
  }, [loading, cacheKeyBase, isMounted]);

  // Hydrate data from cache for perceived-fast load
  useEffect(() => {
    if (!isMounted || !orgResolved) return;
    try {
      const raw = localStorage.getItem(cacheKeyBase);
      if (raw) {
        const parsed = JSON.parse(raw) as { data?: AttendanceListItem[] | any[]; total?: number; tz?: string; ts?: number };
        const TTL = 180_000; // 3 minutes cache TTL (align with members page staleTime)
        if (!parsed.ts || Date.now() - parsed.ts < TTL) {
          if (Array.isArray(parsed.data)) {
            // Normalize legacy cached items to include method fields
            const normalized = (parsed.data as any[]).map((r: any) => {
              const inMethod = r.checkInMethod ?? (r.checkInDeviceId ? 'device' : (r.checkIn ? 'manual' : null));
              const outMethod = r.checkOutMethod ?? (r.checkOutDeviceId ? 'device' : (r.checkOut ? 'manual' : null));
              return { ...r, checkInMethod: inMethod, checkOutMethod: outMethod } as AttendanceListItem;
            });
            setAttendanceData(normalized);
            setTotalItems(parsed.total || 0);
            if (parsed.tz) setUserTimezone(parsed.tz);
            // If we successfully hydrated data, ensure loading UI doesn't block
            setLoading(false);
            setInitialized(true);
          }
        }
      }
    } catch { }
  }, [cacheKeyBase, isMounted, orgResolved]);

  // Seed from SSR initialData if cache empty
  useEffect(() => {
    if (!isMounted || !orgResolved) return;
    if (attendanceData.length === 0 && Array.isArray(_initialData) && _initialData.length > 0) {
      const normalized = (_initialData as any[]).map((r: any) => {
        const inMethod = r.checkInMethod ?? (r.checkInDeviceId ? 'device' : (r.checkIn ? 'manual' : null));
        const outMethod = r.checkOutMethod ?? (r.checkOutDeviceId ? 'device' : (r.checkOut ? 'manual' : null));
        return { ...r, checkInMethod: inMethod, checkOutMethod: outMethod } as AttendanceListItem;
      });
      setAttendanceData(normalized);
      setTotalItems(initialMeta?.total || _initialData.length || 0);
      if (initialMeta?.tz) setUserTimezone(initialMeta.tz);
      setLoading(false);
      setInitialized(true);
      try {
        localStorage.setItem(cacheKeyBase, JSON.stringify({ data: normalized, total: initialMeta?.total || _initialData.length || 0, tz: initialMeta?.tz, ts: Date.now() }));
      } catch { }
    }
  }, [isMounted, _initialData, initialMeta, cacheKeyBase, orgResolved]);

  // Reset view state when organization changes to avoid cross-org stale UI
  useEffect(() => {
    if (!orgResolved) return;
    setDepartments([]);
    setAttendanceData([]);
    setTotalItems(0);
    setInitialized(false);
  }, [selectedOrgId, orgStore.organizationId]);

  // Recompute departments from current data to reflect the active organization
  useEffect(() => {
    const uniqueDepts = Array.from(new Set(
      attendanceData.map((r) => r.member?.department)
    )).filter((d): d is string => Boolean(d && d !== 'No Department')).sort();
    // Only update if changed to avoid unnecessary renders
    const same = uniqueDepts.length === departments.length && uniqueDepts.every((d, i) => d === departments[i]);
    if (!same) setDepartments(uniqueDepts);
  }, [attendanceData]);

  // Edit form schema (edit check-in/out time and remarks)
  const editFormSchema = z.object({
    checkInDate: z.string().min(1, 'Check-in date is required'),
    checkInTime: z.string().min(1, 'Check-in time is required'),
    checkOutDate: z.string().optional(),
    checkOutTime: z.string().optional(),
    remarks: z.string().optional(),
  });

  type EditFormValues = z.infer<typeof editFormSchema>;

  const editForm = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      checkInDate: '',
      checkInTime: '',
      checkOutDate: '',
      checkOutTime: '',
      remarks: '',
    },
  });

  const handleDeleteClick = async (recordId: string) => {
    setRecordToDelete(recordId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;

    try {
      setIsSubmitting(true);
      const result = await deleteAttendanceRecord(recordToDelete);

      if (result.success) {
        toast.success('Attendance record deleted successfully');
        setDeleteDialogOpen(false);
        setRecordToDelete(null);
        // Refresh data
        const orgId = selectedOrgId || orgStore.organizationId;
        if (orgId) {
          const response = await getAllAttendance({ organizationId: orgId });
          if (response.success) {
            setAttendanceData(response.data);
            setTotalItems(response.meta?.total || 0);
          }
        }
      } else {
        toast.error(result.message || 'Failed to delete record');
      }
    } catch (error) {
      toast.error('Error deleting record');
      console.error('Delete error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedRecords.length === 0) return;

    try {
      setIsSubmitting(true);
      const result = await deleteMultipleAttendanceRecords(selectedRecords);

      if (result.success) {
        toast.success(`${selectedRecords.length} record(s) deleted successfully`);
        setSelectedRecords([]);
        // Refresh data
        const orgId = selectedOrgId || orgStore.organizationId;
        if (orgId) {
          const response = await getAllAttendance({ organizationId: orgId });
          if (response.success) {
            setAttendanceData(response.data);
            setTotalItems(response.meta?.total || 0);
          }
        }
      } else {
        toast.error(result.message || 'Failed to delete records');
      }
    } catch (error) {
      toast.error('Error deleting records');
      console.error('Delete error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = () => {
    const recordsToEdit = attendanceData.filter(r => selectedRecords.includes(r.id));
    setEditingRecords(recordsToEdit);
    const first = recordsToEdit[0];
    const ci = first?.checkIn ? new Date(first.checkIn) : null;
    const co = first?.checkOut ? new Date(first.checkOut) : null;
    editForm.reset({
      checkInDate: ci ? `${ci.getFullYear()}-${pad2(ci.getMonth() + 1)}-${pad2(ci.getDate())}` : toLocalYMD(new Date()),
      checkInTime: ci ? toLocalHM(ci) : '08:00',
      checkOutDate: co ? `${co.getFullYear()}-${pad2(co.getMonth() + 1)}-${pad2(co.getDate())}` : '',
      checkOutTime: co ? toLocalHM(co) : '',
      remarks: '',
    });
    setEditDialogOpen(true);
  };

  const handleEditSingle = (rec: AttendanceListItem) => {
    setEditingRecords([rec]);
    setSelectedRecords([rec.id]);
    const ci = rec?.checkIn ? new Date(rec.checkIn) : null;
    const co = rec?.checkOut ? new Date(rec.checkOut) : null;
    editForm.reset({
      checkInDate: ci ? `${ci.getFullYear()}-${pad2(ci.getMonth() + 1)}-${pad2(ci.getDate())}` : toLocalYMD(new Date()),
      checkInTime: ci ? toLocalHM(ci) : '08:00',
      checkOutDate: co ? `${co.getFullYear()}-${pad2(co.getMonth() + 1)}-${pad2(co.getDate())}` : '',
      checkOutTime: co ? toLocalHM(co) : '',
      remarks: '',
    });
    setEditDialogOpen(true);
  };

  // Handle edit form submit
  const onEditSubmit = async (values: EditFormValues) => {
    try {
      setIsSubmitting(true);
      const ciDate = buildDateTime(values.checkInDate, values.checkInTime);
      const payloads = selectedRecords.map((id) => ({
        id,
        actual_check_in: toTimestampWithTimezone(ciDate),
        actual_check_out: values.checkOutDate && values.checkOutTime
          ? toTimestampWithTimezone(buildDateTime(values.checkOutDate, values.checkOutTime))
          : null,
        remarks: values.remarks && values.remarks.trim() !== '' ? values.remarks.trim() : null,
      }));
      for (const p of payloads) {
        const res = await updateAttendanceRecord(p);
        if (!res.success) {
          throw new Error(res.message || 'Failed to update record');
        }
      }
      toast.success(`Updated ${selectedRecords.length} record(s)`);
      setEditDialogOpen(false);
      setSelectedRecords([]);
      fetchDataRef.current();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update records');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 10);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch data using Server Action with pagination
  const fetchData = useCallback(async () => {
    const orgId = selectedOrgId || orgStore.organizationId;
    console.log('🔄 Fetch triggered:', {
      page: currentPage,
      itemsPerPage,
      orgId,
      hasDateFilter: false, // sementara non-aktif
      statusFilter,
      departmentFilter,
      searchQuery
    });
    // Require orgId to avoid relying on server-side auth cookies in production
    if (!orgId) {
      console.warn('[fetchData] Skipped: organizationId not ready yet');
      // keep loading until orgId resolved to avoid empty flash
      return;
    }
    setLoading(true);
    const reqId = latestRequestRef.current + 1;

    latestRequestRef.current = reqId;
    try {
      const searchParam = (searchQuery || '').trim();
      // Use local date (not UTC) to avoid day-shift in production

      const [listResult] = await Promise.all([
        getAllAttendance({
          page: currentPage,
          limit: itemsPerPage,
          dateFrom: toOrgYMD(dateRange.from),
          dateTo: toOrgYMD(dateRange.to),
          search: searchParam.length >= 2 ? searchParam : undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          department: departmentFilter === 'all' ? undefined : departmentFilter,
          organizationId: orgId,
        })
      ]);

      const result: GetAttendanceResult = (listResult && typeof listResult === 'object' && 'success' in listResult)
        ? (listResult as GetAttendanceResult)
        : { success: false, data: [], meta: { total: 0, page: 1, limit: itemsPerPage, totalPages: 0, nextCursor: undefined }, message: 'Invalid response from server' };

      if (result.success) {
        const data = (result.data || []) as AttendanceListItem[];
        console.log('📊 Attendance data received:', {
          count: data.length,
          total: result.meta?.total,
          firstItem: data[0],
          allData: data
        });
        if (reqId !== latestRequestRef.current) {
          return; // stale response
        }
        setAttendanceData(data);
        const correctedTotal = Math.max(result.meta?.total || 0, data.length);
        setTotalItems(correctedTotal);

        // Set timezone from first record if available (fallback to UTC)
        if (data.length > 0) {
          const first = data[0];
          setUserTimezone(first?.timezone || 'UTC');
        }

        // Extract unique departments from current page (simple solution for now)
        if (data.length > 0) {
          const uniqueDepts = Array.from(new Set(
            data.map((r) => r.member?.department)
          )).filter((dept): dept is string => Boolean(dept && dept !== 'No Department')).sort();

          if (departments.length === 0 && uniqueDepts.length > 0) {
            setDepartments(uniqueDepts);
          }
        }
        try {
          const tz = data.length > 0 ? (data[0]?.timezone ?? 'UTC') : undefined;
          localStorage.setItem(cacheKeyBase, JSON.stringify({ data, total: correctedTotal, tz, ts: Date.now() }));
        } catch { }
      } else {
        console.error('Failed to load attendance:', result?.message ?? result);
        setAttendanceData([]);
        setTotalItems(0);
        toast.error(result.message || 'Failed to load attendance data');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      // Don't clear existing data on error, just log it
      // setAttendanceData([]);
      // setTotalItems(0);
      // Only show error if we don't have any data
      if (attendanceData.length === 0) {
        toast.error('An error occurred while fetching data');
      }
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [currentPage, itemsPerPage, dateRange, searchQuery, statusFilter, departmentFilter, selectedOrgId, orgStore.organizationId, userTimezone]);

  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);


  // Trigger fetch when filters change (and initial load)
  useEffect(() => {
    console.log('🔄 Fetch triggered:', { currentPage, dateRange, searchQuery, statusFilter, departmentFilter });
    fetchData();
  }, [fetchData]);

  // Realtime subscription to attendance_records (similar to finger page)
  useEffect(() => {
    const orgId = selectedOrgId || orgStore.organizationId;
    if (!orgId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`attendance-records-${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records'
        },
        (payload: PgChange<AttendanceChangeRow>) => {
          const newRow = payload.new;
          const oldRow = payload.old;
          const payloadOrgId = newRow?.organization_id ?? oldRow?.organization_id;
          if (payloadOrgId && orgId && Number(payloadOrgId) !== Number(orgId)) {
            return;
          }
          const rawDate = (newRow?.attendance_date as string | undefined) || (oldRow?.attendance_date as string | undefined);

          if (rawDate) {
            const match = /^\d{4}-\d{2}-\d{2}/.exec(String(rawDate));
            const recordYMD = match ? match[0] : toLocalYMD(new Date(String(rawDate)));
            const fromStr = toLocalYMD(dateRange.from);
            const toStr = toLocalYMD(dateRange.to);

            if (recordYMD < fromStr || recordYMD > toStr) {
              return;
            }
          }
          const changedId = (newRow as any)?.id ?? (oldRow as any)?.id;
          if (typeof changedId === 'number') {
            pendingIdsRef.current.add(Number(changedId));
          }
          if (flushTimerRef.current) {
            window.clearTimeout(flushTimerRef.current);
          }
          flushTimerRef.current = window.setTimeout(() => {
            const ids = Array.from(pendingIdsRef.current);
            pendingIdsRef.current.clear();
            try {
              localStorage.removeItem(cacheKeyBase);
              localStorage.removeItem(`${cacheKeyBase}:loading`);
            } catch { }
            if (ids.length === 1) {
              fetchAndMergeRecord(ids[0]!);
            } else if (ids.length > 1) {
              fetchAndMergeMany(ids);
            } else {
              fetchData();
            }
          }, 500);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeActive(true);
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') setRealtimeActive(false);
      });

    return () => {
      setRealtimeActive(false);
      if (realtimeDebounceRef.current) {
        window.clearTimeout(realtimeDebounceRef.current);
        realtimeDebounceRef.current = null;
      }
      if (flushTimerRef.current) {
        window.clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [selectedOrgId, orgStore.organizationId, dateRange.from, dateRange.to, fetchData]);

  // Fallback polling if realtime not active
  useEffect(() => {
    if (realtimeActive) return;
    const id = window.setInterval(() => {
      fetchData();
    }, 30000); // 30s fallback
    return () => window.clearInterval(id);
  }, [realtimeActive, fetchData]);

  // Log attendanceData changes
  useEffect(() => {
    console.log('📊 Attendance data state updated:', {
      length: attendanceData.length,
      totalItems,
      loading,
      firstItem: attendanceData[0]
    });
  }, [attendanceData, totalItems, loading]);

  // Reset to page 1 when filters change (except pagination itself)
  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange, searchQuery, statusFilter, departmentFilter]);

  // Auto-refresh Timer - Disabled for now to prevent errors
  // useEffect(() => {
  //   // Only run timer if not loading and not paused
  //   if (loading || isAutoRefreshPaused) return;

  //   const timer = setInterval(() => {
  //     fetchData();
  //   }, 10000); // 10 seconds

  //   return () => clearInterval(timer);
  // }, [loading, isAutoRefreshPaused, fetchData]);

  // Helper component to display device location
  interface LocationDisplayProps {
    checkInLocationName?: string | null;
    checkOutLocationName?: string | null;
  }
  const LocationDisplay = ({ checkInLocationName, checkOutLocationName }: LocationDisplayProps) => {
    if (!checkInLocationName && !checkOutLocationName) {
      return <span className="text-muted-foreground text-xs">No Location</span>;
    }

    if (checkInLocationName && checkOutLocationName && checkInLocationName === checkOutLocationName) {
      return (
        <div className="flex items-center gap-1 text-sm">
          <MapPin className="h-3 w-3 text-blue-600 dark:text-blue-400" />
          <span className="text-foreground">{checkInLocationName}</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        {checkInLocationName && (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-green-600 dark:text-green-400 font-medium">IN:</span>
            <MapPin className="h-3 w-3 text-green-600 dark:text-green-400" />
            <span className="text-foreground">{checkInLocationName}</span>
          </div>
        )}
        {checkOutLocationName && (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-red-600 dark:text-red-400 font-medium">OUT:</span>
            <MapPin className="h-3 w-3 text-red-600 dark:text-red-400" />
            <span className="text-foreground">{checkOutLocationName}</span>
          </div>
        )}
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'late':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'absent':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'leave':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'late':
        return <Timer className="h-3 w-3" />;
      case 'absent':
        return <XCircle className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  const handleSelectAll = () => {
    if (selectedRecords.length === attendanceData.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(attendanceData.map((r: AttendanceListItem) => r.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters & Actions */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[260px] relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name or department..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchQuery(searchInput);
                  }
                }}
                className="pl-10 border-gray-300"
              />
            </div>

            {/* Refresh */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                try {
                  localStorage.removeItem(cacheKeyBase);
                  localStorage.removeItem(`${cacheKeyBase}:loading`);
                } catch { }
                fetchData();
              }}
              title="Refresh"
              className="border-gray-300 shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            {/* View toggle */}
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              title={viewMode === 'list' ? 'Switch to grid view' : 'Switch to list view'}
              className={viewMode === 'grid' ? 'shrink-0' : 'border-gray-300 shrink-0'}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>

            {/* Date Filter */}
            <div className="shrink-0">
              <DateFilterBar
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 shrink-0">
              {isMounted ? (
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 border-gray-300">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="w-40 h-9 border border-gray-300 rounded bg-muted/50" aria-hidden />
              )}
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-2 shrink-0">
              {isMounted ? (
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-[180px] border-gray-300">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="w-[180px] h-9 border border-gray-300 rounded bg-muted/50" aria-hidden />
              )}
            </div>

            {/* Manual Entry Button */}
            <Link href="/attendance/list/add" className="shrink-0">
              <Button className="bg-black text-white hover:bg-black/90 whitespace-nowrap">
                <Plus className="mr-2 h-4 w-4" />
                Manual Entry
              </Button>
            </Link>
            <Link href="/attendance/import" className="shrink-0">
              <Button variant="outline" className="whitespace-nowrap">
                <Download className="mr-2 h-4 w-4" />
                Import
              </Button>
            </Link>
          </div>

          {/* Selected Actions */}
          <AnimatePresence>
            {selectedRecords.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2"
              >
                <span className="text-sm font-medium">
                  {selectedRecords.length} selected
                </span>
                <Separator orientation="vertical" className="h-6" />
                {/* <Button variant="ghost" size="sm">
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </Button> */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditClick}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {selectedRecords.length === 1 ? 'Edit' : 'Bulk Edit'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteMultiple}
                  disabled={isSubmitting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRecords([])}
                  className="ml-auto"
                >
                  Clear Selection
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Summary Stats - Interactive Cards - REMOVED as requested */}

      {/* Charts Section - REMOVED as requested */}

      {/* Attendance List */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-0">
            {/* Mobile Card View - Only show on small screens */}
            <div className="hidden">
              {(loading || !initialized) ? (
                <div className="divide-y">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={`mobile-skel-${i}`} className="p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 min-w-0 space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : attendanceData.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No attendance records found
                </div>
              ) : (
                attendanceData.map((record, index: number) => {
                  if (!record || !record.id) {
                    console.warn('Invalid record at index', index, record);
                    return null;
                  }
                  return (
                    <div
                      key={`mobile-${record.id}-${index}`}
                      className="p-4 space-y-3 border-b last:border-b-0"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedRecords.includes(record.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRecords([...selectedRecords, record.id]);
                              } else {
                                setSelectedRecords(selectedRecords.filter(id => id !== record.id));
                              }
                            }}
                            className="rounded border-gray-300 mt-1"
                          />
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage src={record.member.avatar} />
                            <AvatarFallback>
                              {initialsFromName(record.member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">
                              <Link href={`/members/${record.member.id ?? ''}`} className="hover:underline">
                                {record.member.name}
                              </Link>
                            </p>
                            <p className="text-sm text-muted-foreground truncate">{record.member.department}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Edit"
                            onClick={() => handleEditSingle(record)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Delete"
                            onClick={() => handleDeleteClick(record.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Check In</p>
                          <p className="font-mono text-sm">
                            {record.checkIn ? formatLocalTime(record.checkIn, userTimezone, '24h', true) : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Check Out</p>
                          <p className="font-mono text-sm">
                            {record.checkOut ? formatLocalTime(record.checkOut, userTimezone, '24h', true) : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Work Hours</p>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-sm">{record.workHours}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Status</p>
                          <Badge className={cn('gap-1', getStatusColor(record.status))}>
                            {getStatusIcon(record.status)}
                            {record.status}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Location</p>
                        <LocationDisplay
                          checkInLocationName={record.checkInLocationName}
                          checkOutLocationName={record.checkOutLocationName}
                        />
                      </div>
                    </div>
                  );
                }).filter(Boolean)
              )}
            </div>

            {/* Desktop Table View - Show on larger screens */}
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[880px]">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRecords.length === attendanceData.length && attendanceData.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="p-3 text-left text-xs font-medium">Member</th>
                    <th className="p-3 text-left text-xs font-medium">Check In</th>
                    <th className="p-3 text-left text-xs font-medium">Check Out</th>
                    <th className="p-3 text-left text-xs font-medium">Work Hours</th>
                    <th className="p-3 text-left text-xs font-medium">Status</th>
                    <th className="p-3 text-left text-xs font-medium">Method</th>
                    <th className="p-3 text-left text-xs font-medium">Location</th>
                    <th className="p-3 text-left text-xs font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&>tr:nth-child(even)]:bg-muted/50">
                  {(loading || !initialized) ? (
                    <>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <tr key={`table-skel-${i}`} className="border-b">
                          <td className="p-3">
                            <Skeleton className="h-3 w-3 rounded" />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-8 w-8 rounded-full" />
                              <div className="space-y-2">
                                <Skeleton className="h-3 w-40" />
                                <Skeleton className="h-2.5 w-24" />
                              </div>
                            </div>
                          </td>
                          <td className="p-3"><Skeleton className="h-3 w-16" /></td>
                          <td className="p-3"><Skeleton className="h-3 w-16" /></td>
                          <td className="p-3"><Skeleton className="h-3 w-20" /></td>
                          <td className="p-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                          <td className="p-3"><Skeleton className="h-3 w-24" /></td>
                          <td className="p-3"><Skeleton className="h-3 w-28" /></td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <Skeleton className="h-8 w-8 rounded" />
                              <Skeleton className="h-8 w-8 rounded" />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </>
                  ) : attendanceData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-6 text-muted-foreground text-sm">
                        No attendance records found
                      </td>
                    </tr>
                  ) : (
                    attendanceData.map((record: AttendanceListItem, index: number) => {
                      if (!record || !record.id) {
                        console.warn('Invalid record at index', index, record);
                        return null;
                      }
                      console.log(`📋 Rendering table row ${index + 1}/${attendanceData.length}:`, record.id, record.member.name);
                      return (
                        <tr
                          key={`table-${record.id}-${index}`}
                          className="border-b hover:bg-muted/50 transition-colors"
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedRecords.includes(record.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRecords([...selectedRecords, record.id]);
                                } else {
                                  setSelectedRecords(selectedRecords.filter(id => id !== record.id));
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={record.member.avatar} />
                                <AvatarFallback>
                                  {initialsFromName(record.member.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">
                                  <Link href={`/members/${record.member.id ?? ''}`} className="hover:underline">
                                    {record.member.name}
                                  </Link>
                                </p>
                                <p className="text-xs text-muted-foreground">{record.member.department}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="font-mono text-xs">
                              {record.checkIn ? formatLocalTime(record.checkIn, userTimezone, '24h', true) : '-'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-mono text-xs">
                              {record.checkOut ? formatLocalTime(record.checkOut, userTimezone, '24h', true) : '-'}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-xs">{record.workHours}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className={cn('gap-1 px-2 py-0.5 text-xs', getStatusColor(record.status))}>
                              {getStatusIcon(record.status)}
                              {record.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <MethodDisplay
                              checkInMethod={record.checkInMethod}
                              checkOutMethod={record.checkOutMethod}
                            />
                          </td>
                          <td className="p-3">
                            <LocationDisplay
                              checkInLocationName={record.checkInLocationName}
                              checkOutLocationName={record.checkOutLocationName}
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Edit"
                                onClick={() => handleEditSingle(record)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Delete"
                                onClick={() => handleDeleteClick(record.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    }).filter(Boolean)
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer (aligned with Members) */}
            {!loading && (
              <PaginationFooter
                page={currentPage}
                totalPages={Math.max(1, Math.ceil((Math.max(totalItems, attendanceData.length) || 0) / itemsPerPage))}
                onPageChange={(p) => setCurrentPage(Math.max(1, p))}
                isLoading={loading}
                from={(Math.max(totalItems, attendanceData.length) > 0) ? (currentPage - 1) * itemsPerPage + 1 : 0}
                to={(Math.max(totalItems, attendanceData.length) > 0) ? Math.min(currentPage * itemsPerPage, Math.max(totalItems, attendanceData.length)) : 0}
                total={Math.max(totalItems, attendanceData.length)}
                pageSize={itemsPerPage}
                onPageSizeChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
                pageSizeOptions={[10, 20, 50]}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <>
          {loading && attendanceData.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-muted-foreground">Loading attendance data...</span>
                </div>
              </CardContent>
            </Card>
          ) : attendanceData.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No attendance records found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {attendanceData.map((record: AttendanceListItem, index: number) => {
                if (!record || !record.id) {
                  return null;
                }
                console.log(`🎴 Rendering grid card ${index + 1}/${attendanceData.length}:`, record.id, record.member.name);
                return (
                  <div
                    key={`grid-${record.id}-${index}`}
                    className="relative"
                  >
                    {/* Checkbox - Top Left */}
                    <div className="absolute top-3 left-3 z-10">
                      <input
                        type="checkbox"
                        checked={selectedRecords.includes(record.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRecords([...selectedRecords, record.id]);
                          } else {
                            setSelectedRecords(selectedRecords.filter(id => id !== record.id));
                          }
                        }}
                        className="rounded border-gray-300 w-5 h-5 cursor-pointer"
                      />
                    </div>
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={record.member.avatar} />
                              <AvatarFallback>
                                {initialsFromName(record.member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">
                                <Link href={`/members/${record.member.id ?? ''}`} className="hover:underline">
                                  {record.member.name}
                                </Link>
                              </p>
                              <p className="text-sm text-muted-foreground">{record.member.department}</p>
                            </div>
                          </div>
                          <Badge className={cn('gap-1', getStatusColor(record.status))}>
                            {getStatusIcon(record.status)}
                            {record.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Check In</p>
                            <p className="font-mono font-medium">
                              {record.checkIn ? formatLocalTime(record.checkIn, userTimezone, '24h', true) : '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Check Out</p>
                            <p className="font-mono font-medium">
                              {record.checkOut ? formatLocalTime(record.checkOut, userTimezone, '24h', true) : '-'}
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Work Hours</span>
                          <span className="font-semibold">{record.workHours}</span>
                        </div>
                        <LocationDisplay
                          checkInLocationName={record.checkInLocationName}
                          checkOutLocationName={record.checkOutLocationName}
                        />
                      </CardContent>
                    </Card>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          )}
        </>
      )}

      {/* Edit Dialog Modal */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedRecords.length === 1 ? 'Edit Attendance' : `Bulk Edit (${selectedRecords.length} records)`}
            </DialogTitle>
            <DialogDescription>
              {selectedRecords.length === 1
                ? `Edit attendance record for ${editingRecords[0]?.member?.name || 'member'}`
                : `Update status and remarks for ${selectedRecords.length} selected records`
              }
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              {/* Check-in */}
              <div className="space-y-2">
                <FormLabel>Check-in</FormLabel>
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={editForm.control}
                    name="checkInDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="checkInTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Check-out (Optional) */}
              <div className="space-y-2">
                <FormLabel>Check-out (Optional)</FormLabel>
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={editForm.control}
                    name="checkOutDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="checkOutTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Remarks Field */}
              <FormField
                control={editForm.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Add remarks..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Display affected records */}
              {selectedRecords.length > 1 && (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p className="font-medium mb-2">Affected Records:</p>
                  <ul className="space-y-1 text-xs">
                    {editingRecords.slice(0, 5).map((record) => (
                      <li key={record.id}>
                        • {record.member?.name} ({record.member?.department})
                      </li>
                    ))}
                    {editingRecords.length > 5 && (
                      <li className="text-muted-foreground">... and {editingRecords.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Attendance Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this attendance record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm">
            <p className="font-medium text-destructive mb-1">Warning</p>
            <p className="text-destructive/80">
              This will permanently delete the attendance record from the database.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
