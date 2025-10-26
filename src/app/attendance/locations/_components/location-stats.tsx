"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Users, CheckCircle, XCircle } from "lucide-react";

interface LocationStatsProps {
  totalLocations: number;
  activeLocations: number;
  totalCheckinsToday?: number;
}

export function LocationStats({
  totalLocations,
  activeLocations,
  totalCheckinsToday = 0,
}: LocationStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Locations</p>
              <p className="text-2xl font-bold">{totalLocations}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Locations</p>
              <p className="text-2xl font-bold">{activeLocations}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Check-ins Today</p>
              <p className="text-2xl font-bold">{totalCheckinsToday}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
