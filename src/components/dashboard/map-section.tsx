"use client";


import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import "leaflet/dist/leaflet.css";

// We need to import react-leaflet components dynamically or ensure this component is only rendered on client
// However, since we'll use dynamic import in the parent, we can import directly here IF the parent handles SSR=false.
// But to be safe and self-contained, using a mounted check is good practice, 
// OR simpler: assume parent uses next/dynamic with ssr: false.
// Let's use standard imports but rely on the parent to load this component dynamically.

import { MapContainer, TileLayer } from "react-leaflet";
import L from "leaflet";

// Fix for default marker icons in Next.js/Leaflet
const iconUrl = "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png";

// Only run this fixing code on client
if (typeof window !== "undefined") {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: iconRetinaUrl,
        iconUrl: iconUrl,
        shadowUrl: shadowUrl,
    });
}

export default function DashboardMap() {
    // Center of the map (approximate center or Indonesia if preferred)
    // Coords for Jakarta: -6.2088, 106.8456. But screenshot shows world map.
    // Let's settle on a wide view.
    const position: [number, number] = [20, 0];

    return (
        <div className="relative w-full h-[500px] rounded-lg overflow-hidden border shadow-sm group">
            <MapContainer
                center={position}
                zoom={2}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
                className="z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Example Marker (Optional, maybe hidden if empty) */}
                {/* <Marker position={[-6.2088, 106.8456]}>
                    <Popup>
                        Jakarta Office
                    </Popup>
                </Marker> */}
            </MapContainer>

            {/* Overlay: Center "No active members" Card */}
            <div className="absolute inset-0 z-[400] flex items-center justify-center pointer-events-none">
                <Card className="w-[280px] shadow-lg bg-white/95 backdrop-blur-sm pointer-events-auto">
                    <CardContent className="p-6 text-center space-y-4">
                        <div className="space-y-1">
                            <h3 className="font-semibold text-gray-900">No active members or job sites</h3>
                            {/* <p className="text-sm text-gray-500">Start tracking to see live activity.</p> */}
                        </div>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            Enable map
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Overlay: Right Action Button */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[400]">
                <Button size="icon" className="rounded-full h-12 w-12 bg-blue-500 hover:bg-blue-600 shadow-lg text-white">
                    <Plus className="h-6 w-6" />
                </Button>
            </div>

            {/* Overlay: Bottom Right Stats */}
            <div className="absolute bottom-4 right-4 z-[400] pointer-events-none">
                <Card className="shadow-lg bg-white/95 backdrop-blur-sm pointer-events-auto min-w-[240px]">
                    <CardContent className="p-4 grid grid-cols-2 divide-x">
                        <div className="px-4 text-center">
                            <div className="text-2xl font-bold text-gray-900">0</div>
                            <div className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">Active members &gt;</div>
                        </div>
                        <div className="px-4 text-center">
                            <div className="text-2xl font-bold text-gray-900">0</div>
                            <div className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">Active job sites &gt;</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
