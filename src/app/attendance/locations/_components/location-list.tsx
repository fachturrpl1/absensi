"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IAttendanceDevice, IDeviceType } from "@/interface";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Plus, Edit, Search } from "lucide-react";
import { toggleDeviceStatus } from "@/action/attendance_device";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { LocationStats } from "./location-stats";

interface LocationListProps {
  initialDevices: IAttendanceDevice[];
  deviceTypes: IDeviceType[];
  organizationId: string;
}

export default function LocationList({
  initialDevices,
}: LocationListProps) {
  const router = useRouter();
  const [devices, setDevices] = useState(initialDevices);
  const [search, setSearch] = useState("");

  const filteredDevices = devices.filter((device) =>
    device.device_name.toLowerCase().includes(search.toLowerCase()) ||
    device.location?.toLowerCase().includes(search.toLowerCase()) ||
    device.device_code.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const result = await toggleDeviceStatus(id, !currentStatus);
    if (result.success) {
      setDevices(devices.map(d => 
        d.id === id ? { ...d, is_active: !currentStatus } : d
      ));
      toast.success(`Location ${!currentStatus ? 'activated' : 'deactivated'}`);
    } else {
      toast.error(result.message || "Failed to update status");
    }
  };

  const activeCount = devices.filter(d => d.is_active).length;

  return (
    <div className="space-y-4">
      <LocationStats
        totalLocations={devices.length}
        activeLocations={activeCount}
      />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Attendance Locations
            </CardTitle>
            <Button onClick={() => router.push("/attendance/locations/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, location, or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead>Radius</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No locations found. Click "Add Location" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDevices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium">
                        {device.device_name}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {device.device_code}
                        </code>
                      </TableCell>
                      <TableCell>{device.location || "-"}</TableCell>
                      <TableCell>
                        {device.latitude && device.longitude ? (
                          <span className="text-xs text-muted-foreground">
                            {Number(device.latitude).toFixed(6)}, {Number(device.longitude).toFixed(6)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {device.radius_meters ? `${device.radius_meters}m` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {device.device_types?.name || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={device.is_active}
                            onCheckedChange={() => handleToggleStatus(device.id, device.is_active)}
                          />
                          <Badge variant={device.is_active ? "default" : "secondary"}>
                            {device.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/attendance/locations/${device.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
