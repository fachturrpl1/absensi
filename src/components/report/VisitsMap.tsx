"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix for default marker icons in Next.js
const iconUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png"
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png"
const shadowUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png"

const defaultIcon = L.icon({
    iconUrl: iconUrl,
    iconRetinaUrl: iconRetinaUrl,
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

L.Marker.prototype.options.icon = defaultIcon

interface Visit {
    id: string
    memberName: string
    locationName: string
    address: string
    coordinates?: {
        lat: number
        lng: number
    }
}

interface VisitsMapProps {
    visits: Visit[]
}

export default function VisitsMap({ visits }: VisitsMapProps) {
    const validVisits = visits.filter(v => v.coordinates)
    const firstVisitCoords = validVisits[0]?.coordinates
    const centerPossition: [number, number] = firstVisitCoords
        ? [firstVisitCoords.lat, firstVisitCoords.lng]
        : [-6.2088, 106.8456] // Jakarta default

    return (
        <div className="h-[600px] w-full rounded-lg overflow-hidden border shadow-sm z-0 relative">
            <MapContainer
                center={centerPossition}
                zoom={13}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {validVisits.map(visit => (
                    <Marker
                        key={visit.id}
                        position={[visit.coordinates!.lat, visit.coordinates!.lng]}
                    >
                        <Popup>
                            <div className="p-1">
                                <h3 className="font-bold text-sm">{visit.locationName}</h3>
                                <p className="text-xs text-gray-600">{visit.memberName}</p>
                                <p className="text-xs text-gray-500 mt-1">{visit.address}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    )
}
