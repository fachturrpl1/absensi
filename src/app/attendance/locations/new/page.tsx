import { ContentLayout } from "@/components/admin-panel/content-layout";
import { getDeviceTypes } from "@/action/attendance_device";
import { IDeviceType } from "@/interface";
import LocationForm from "../_components/location-form";
import { createClient } from "@/utils/supabase/server";

export default async function NewLocationPage() {
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

  const deviceTypesRes = await getDeviceTypes();
  const deviceTypes = (deviceTypesRes.success ? deviceTypesRes.data : []) as IDeviceType[];

  return (
    <ContentLayout title="Add New Location">
      <LocationForm deviceTypes={deviceTypes} organizationId={organizationId} />
    </ContentLayout>
  );
}
