"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IAttendanceDevice, IDeviceType } from "@/interface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { createAttendanceDevice, updateAttendanceDevice } from "@/action/attendance_device";
import { toast } from "sonner";
import { Save, ArrowLeft, Smartphone } from "lucide-react";
import LocationMap from "./location-map";

interface LocationFormProps {
  device?: IAttendanceDevice;
  deviceTypes: IDeviceType[];
  organizationId: string;
}

export default function LocationForm({
  device,
  deviceTypes,
  organizationId,
}: LocationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Auto-detect mobile device type ID
  const mobileDeviceType = deviceTypes.find(
    (type) => type.category?.toLowerCase() === "mobile" || type.name?.toLowerCase().includes("mobile")
  );

  const [formData, setFormData] = useState({
    device_name: device?.device_name || "",
    device_code: device?.device_code || "",
    location: device?.location || "",
    latitude: device?.latitude || "",
    longitude: device?.longitude || "",
    radius_meters: device?.radius_meters || 50,
    allow_selfie: device?.configuration?.allow_selfie ?? true,
    require_location: device?.configuration?.require_location ?? true,
    max_distance: device?.configuration?.max_distance || 50,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!mobileDeviceType) {
        toast.error("Mobile device type not found in system");
        return;
      }

      const payload = {
        organization_id: Number(organizationId),
        device_type_id: Number(mobileDeviceType.id),
        device_code: formData.device_code,
        device_name: formData.device_name,
        location: formData.location || undefined,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
        radius_meters: formData.radius_meters || undefined,
        is_active: true,
        configuration: {
          allow_selfie: formData.allow_selfie,
          require_location: formData.require_location,
          max_distance: formData.max_distance,
        },
      };

      const result = device
        ? await updateAttendanceDevice(device.id, payload)
        : await createAttendanceDevice(payload);

      if (result.success) {
        toast.success(device ? "Location updated" : "Location created");
        router.push("/attendance/locations");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to save location");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setFormData({
      ...formData,
      latitude: lat.toFixed(8),
      longitude: lng.toFixed(8),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {device ? "Edit Location" : "Add New Location"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Map Location</CardTitle>
        </CardHeader>
        <CardContent>
          <LocationMap
            latitude={formData.latitude ? Number(formData.latitude) : null}
            longitude={formData.longitude ? Number(formData.longitude) : null}
            radius={formData.radius_meters}
            onMapClick={handleMapClick}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="device_name">Device Name *</Label>
              <Input
                id="device_name"
                required
                value={formData.device_name}
                onChange={(e) =>
                  setFormData({ ...formData, device_name: e.target.value })
                }
                placeholder="e.g., Main Office, Site Pakis"
              />
            </div>

            <div>
              <Label htmlFor="device_code">Device Code *</Label>
              <Input
                id="device_code"
                required
                value={formData.device_code}
                onChange={(e) =>
                  setFormData({ ...formData, device_code: e.target.value })
                }
                placeholder="e.g., MOBILE001"
              />
            </div>

            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Smartphone className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Device Type: Mobile</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Location-based attendance tracking
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location Name</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="e.g., PT UBIG Pakis"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  value={formData.latitude}
                  onChange={(e) =>
                    setFormData({ ...formData, latitude: e.target.value })
                  }
                  placeholder="-7.955152"
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  value={formData.longitude}
                  onChange={(e) =>
                    setFormData({ ...formData, longitude: e.target.value })
                  }
                  placeholder="112.726909"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="radius_meters">
                Radius (meters): {formData.radius_meters}m
              </Label>
              <input
                type="range"
                id="radius_meters"
                min="10"
                max="500"
                step="10"
                value={formData.radius_meters}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    radius_meters: Number(e.target.value),
                  })
                }
                className="w-full"
              />
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label htmlFor="allow_selfie">Require Selfie</Label>
                <Switch
                  id="allow_selfie"
                  checked={formData.allow_selfie}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, allow_selfie: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="require_location">Require GPS</Label>
                <Switch
                  id="require_location"
                  checked={formData.require_location}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, require_location: checked })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button type="submit" disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving..." : "Save Location"}
        </Button>
      </div>
    </form>
  );
}
