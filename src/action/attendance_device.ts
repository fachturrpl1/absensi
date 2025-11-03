"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { IAttendanceDevice, IDeviceType } from "@/interface";

import { attendanceLogger } from '@/lib/logger';
async function getSupabase() {
  return await createClient();
}

export const getAllAttendanceDevices = async () => {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("attendance_devices")
    .select(`
      *,
      device_types (*),
      organizations (id, name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    attendanceLogger.error("❌ Error fetching attendance devices:", error);
    return { success: false, data: [] };
  }

  return { success: true, data: data as IAttendanceDevice[] };
};

export const getAttendanceDeviceById = async (id: string) => {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("attendance_devices")
    .select(`
      *,
      device_types (*),
      organizations (id, name)
    `)
    .eq("id", id)
    .single();

  if (error) {
    attendanceLogger.error("❌ Error fetching attendance device:", error);
    return { success: false, data: null };
  }

  return { success: true, data: data as IAttendanceDevice };
};

export const getDeviceTypes = async () => {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("device_types")
    .select("*")
    .order("name");

  if (error) {
    attendanceLogger.error("❌ Error fetching device types:", error);
    return { success: false, data: [] };
  }

  return { success: true, data: data as IDeviceType[] };
};

type CreateDevicePayload = {
  organization_id: number;
  device_type_id: number;
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
  is_active?: boolean;
  configuration?: Record<string, unknown>;
};

export const createAttendanceDevice = async (payload: CreateDevicePayload) => {
  try {
    const supabase = await getSupabase();

    const { data, error } = await supabase
      .from("attendance_devices")
      .insert([payload])
      .select()
      .single();

    if (error) {
      attendanceLogger.error("❌ Error creating attendance device:", error);
      return { success: false, message: error.message };
    }

    revalidatePath("/attendance/locations");
    return { success: true, data };
  } catch (err) {
    attendanceLogger.error("❌ Exception creating attendance device:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An error occurred",
    };
  }
};

type UpdateDevicePayload = Partial<CreateDevicePayload>;

export const updateAttendanceDevice = async (
  id: string,
  payload: UpdateDevicePayload
) => {
  try {
    const supabase = await getSupabase();

    const { data, error } = await supabase
      .from("attendance_devices")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      attendanceLogger.error("❌ Error updating attendance device:", error);
      return { success: false, message: error.message };
    }

    revalidatePath("/attendance/locations");
    return { success: true, data };
  } catch (err) {
    attendanceLogger.error("❌ Exception updating attendance device:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An error occurred",
    };
  }
};

export const deleteAttendanceDevice = async (id: string) => {
  try {
    const supabase = await getSupabase();

    const { error } = await supabase
      .from("attendance_devices")
      .delete()
      .eq("id", id);

    if (error) {
      attendanceLogger.error("❌ Error deleting attendance device:", error);
      return { success: false, message: error.message };
    }

    revalidatePath("/attendance/locations");
    return { success: true };
  } catch (err) {
    attendanceLogger.error("❌ Exception deleting attendance device:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An error occurred",
    };
  }
};

export const toggleDeviceStatus = async (id: string, is_active: boolean) => {
  try {
    const supabase = await getSupabase();

    const { error } = await supabase
      .from("attendance_devices")
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      attendanceLogger.error("❌ Error toggling device status:", error);
      return { success: false, message: error.message };
    }

    revalidatePath("/attendance/locations");
    return { success: true };
  } catch (err) {
    attendanceLogger.error("❌ Exception toggling device status:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An error occurred",
    };
  }
};
