"use client"

import { useEffect, useState } from "react";
import { getAllAttendanceDevices, getDeviceTypes } from "@/action/attendance_device";
import { IAttendanceDevice, IDeviceType } from "@/interface";
import LocationList from "./_components/location-list";
import { useOrgStore } from "@/store/org-store";
import { toast } from "sonner";

export default function LocationsPage() {
  const { organizationId } = useOrgStore();
  const [devices, setDevices] = useState<IAttendanceDevice[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<IDeviceType[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!organizationId) {
          console.log('[LOCATIONS] No organization ID from store');
          return;
        }

        const [devicesRes, typesRes] = await Promise.all([
          getAllAttendanceDevices(organizationId),
          getDeviceTypes(),
        ]);

        if (devicesRes.success && Array.isArray(devicesRes.data)) {
          setDevices(devicesRes.data as IAttendanceDevice[]);
        } else {
          console.warn('[LOCATIONS] Failed to fetch devices');
          setDevices([]);
        }

        if (typesRes.success && Array.isArray(typesRes.data)) {
          setDeviceTypes(typesRes.data as IDeviceType[]);
        } else {
          console.warn('[LOCATIONS] Failed to fetch device types');
          setDeviceTypes([]);
        }
      } catch (error) {
        console.error('[LOCATIONS] Error fetching data:', error);
        toast.error('Failed to load attendance locations');
        setDevices([]);
        setDeviceTypes([]);
      }
    };

    fetchData();
  }, [organizationId]);

  if (!organizationId) {
    return (
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="text-6xl">📍</div>
            <h2 className="text-2xl font-semibold">No Organization Selected</h2>
            <p className="text-muted-foreground max-w-md">
              Please select an organization to view attendance locations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <LocationList
        initialDevices={devices}
        deviceTypes={deviceTypes}
        organizationId={String(organizationId)}
      />
    </div>
  );
}
