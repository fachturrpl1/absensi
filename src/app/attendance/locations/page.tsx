import { ContentLayout } from "@/components/admin-panel/content-layout";
import { getAllAttendanceDevices, getDeviceTypes } from "@/action/attendance_device";
import { IAttendanceDevice, IDeviceType } from "@/interface";
import LocationList from "./_components/location-list";
import { createClient } from "@/utils/supabase/server";

export default async function LocationsPage() {
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

  const [devicesRes, deviceTypesRes] = await Promise.all([
    getAllAttendanceDevices(),
    getDeviceTypes(),
  ]);

  const devices = (devicesRes.success ? devicesRes.data : []) as IAttendanceDevice[];
  const deviceTypes = (deviceTypesRes.success ? deviceTypesRes.data : []) as IDeviceType[];

  const filteredDevices = devices.filter(
    (d) => String(d.organization_id) === organizationId
  );

  return (
    <ContentLayout title="Attendance Locations">
      <LocationList
        initialDevices={filteredDevices}
        deviceTypes={deviceTypes}
        organizationId={organizationId}
      />
    </ContentLayout>
  );
}
