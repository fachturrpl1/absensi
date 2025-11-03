import {
  getAttendanceDeviceById,
  getDeviceTypes,
} from "@/action/attendance_device";
import { IAttendanceDevice, IDeviceType } from "@/interface";
import LocationForm from "../_components/location-form";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";

export default async function EditLocationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  let organizationId = "";

  if (user) {
    const { data } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      organizationId = String(data.organization_id);
    }
  }

  const [deviceRes, deviceTypesRes] = await Promise.all([
    getAttendanceDeviceById(id),
    getDeviceTypes(),
  ]);

  if (!deviceRes.success || !deviceRes.data) {
    notFound();
  }

  const device = deviceRes.data as IAttendanceDevice;
  const deviceTypes = (deviceTypesRes.success
    ? deviceTypesRes.data
    : []) as IDeviceType[];

  if (String(device.organization_id) !== organizationId) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <LocationForm
        device={device}
        deviceTypes={deviceTypes}
        organizationId={organizationId}
      />
    </div>
  );
}
