"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./leaflet-fix.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { attendanceLogger } from '@/lib/logger';
// Fix untuk icon marker leaflet
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapComponentProps {
  latitude: number | null;
  longitude: number | null;
  radius: number;
  onMapClick?: (lat: number, lng: number) => void;
  onLoad?: () => void;
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function MapCenterController({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (latitude && longitude) {
      map.setView([latitude, longitude], 15);
    }
  }, [latitude, longitude, map]);

  return null;
}

export default function MapComponent({
  latitude,
  longitude,
  radius,
  onMapClick,
  onLoad,
}: MapComponentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [key, setKey] = useState(0);
  const [alertDialog, setAlertDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
  }>({
    open: false,
    title: "",
    description: "",
  });

  const defaultCenter: [number, number] = [-7.9551, 112.7269]; // Surabaya
  const center: [number, number] =
    latitude && longitude ? [latitude, longitude] : defaultCenter;

  useEffect(() => {
    if (onLoad) {
      onLoad();
    }
  }, [onLoad]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      // Menggunakan Nominatim OSM API (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        if (onMapClick) {
          onMapClick(parseFloat(lat), parseFloat(lon));
          // Force map remount with new coordinates
          setKey((prev) => prev + 1);
        }
      } else {
        setAlertDialog({
          open: true,
          title: "Location Not Found",
          description: "We couldn't find the location you're looking for. Please try a different search term or be more specific.",
        });
      }
    } catch (error) {
      attendanceLogger.error("Search error:", error);
      setAlertDialog({
        open: true,
        title: "Search Failed",
        description: "Failed to search location. Please check your internet connection and try again.",
      });
    } finally {
      setSearching(false);
    }
  };

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (onMapClick) {
            onMapClick(position.coords.latitude, position.coords.longitude);
            // Force map remount with new coordinates
            setKey((prev) => prev + 1);
          }
        },
        (error) => {
          attendanceLogger.error("Geolocation error:", error);
          setAlertDialog({
            open: true,
            title: "Location Access Denied",
            description: "Failed to get your current location. Please enable location services in your browser settings and try again.",
          });
        }
      );
    } else {
      setAlertDialog({
        open: true,
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support geolocation. Please try using a different browser or enter coordinates manually.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Search address or place name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
          />
        </div>
        <Button onClick={handleSearch} disabled={searching} variant="secondary">
          <Search className="h-4 w-4 mr-2" />
          {searching ? "Searching..." : "Search"}
        </Button>
        <Button onClick={getCurrentLocation} variant="outline">
          <MapPin className="h-4 w-4 mr-2" />
          My Location
        </Button>
      </div>

      <div 
        key={key}
        className="rounded-lg overflow-hidden border shadow-lg" 
        style={{ position: 'relative' }}
      >
        <MapContainer
          key={`map-${key}`}
          center={center}
          zoom={latitude && longitude ? 15 : 12}
          style={{ height: "500px", width: "100%" }}
          scrollWheelZoom={true}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          <MapClickHandler onMapClick={onMapClick} />
          <MapCenterController latitude={latitude} longitude={longitude} />

          {latitude && longitude && (
            <>
              <Marker
                position={[latitude, longitude]}
                icon={icon}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target;
                    const position = marker.getLatLng();
                    if (onMapClick) {
                      onMapClick(position.lat, position.lng);
                    }
                  },
                }}
              />
              <Circle
                center={[latitude, longitude]}
                radius={radius}
                pathOptions={{
                  color: "hsl(var(--primary))",
                  fillColor: "hsl(var(--primary))",
                  fillOpacity: 0.2,
                }}
              />
            </>
          )}
        </MapContainer>
      </div>

      {latitude && longitude && (
        <div className="text-sm p-4 bg-muted/50 rounded-lg">
          <p className="font-mono text-xs text-foreground">
            <strong>Selected:</strong> {latitude.toFixed(6)}, {longitude.toFixed(6)} • Radius: {radius}m
          </p>
        </div>
      )}

      <AlertDialog open={alertDialog.open} onOpenChange={(open) => setAlertDialog({ ...alertDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
