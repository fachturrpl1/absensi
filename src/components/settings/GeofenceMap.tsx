"use client"

import React, { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap, ZoomControl } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { Search, Loader2 } from "lucide-react"

// Fix Leaflet marker icons
const iconUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png"
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png"
const shadowUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png"

interface GeofenceMapProps {
    lat: number | null
    lng: number | null
    radius: number
    onLocationChange: (lat: number, lng: number) => void
}

function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap()
    useEffect(() => {
        if (center[0] !== 0 && center[1] !== 0) {
            map.setView(center, map.getZoom())
        }
    }, [center, map])
    return null
}

function MapEvents({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onLocationChange(e.latlng.lat, e.latlng.lng)
        },
    })
    return null
}

export default function GeofenceMap({ lat, lng, radius, onLocationChange }: GeofenceMapProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [isSearching, setIsSearching] = useState(false)

    useEffect(() => {
        // Fix for standard leaflet icons
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
            iconUrl,
            iconRetinaUrl,
            shadowUrl,
        })
    }, [])

    const defaultCenter: [number, number] = [-6.2088, 106.8456] // Jakarta
    const center: [number, number] = lat && lng ? [lat, lng] : defaultCenter

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchQuery.trim()) return

        setIsSearching(true)
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`)
            const data = await response.json()
            if (data && data.length > 0) {
                const { lat, lon } = data[0]
                onLocationChange(parseFloat(lat), parseFloat(lon))
                setSearchQuery("")
            }
        } catch (error) {
            console.error("Search error:", error)
        } finally {
            setIsSearching(false)
        }
    }

    return (
        <div className="h-full w-full relative min-h-[300px] z-0">
            <MapContainer
                center={center}
                zoom={15}
                zoomControl={false}
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <ZoomControl position="topright" />
                <MapEvents onLocationChange={onLocationChange} />
                <ChangeView center={center} />

                {lat && lng && (
                    <>
                        <Marker position={[lat, lng]} />
                        <Circle 
                            center={[lat, lng]}
                            radius={radius}
                            pathOptions={{
                                fillColor: '#3b82f6',
                                fillOpacity: 0.2,
                                color: '#3b82f6',
                                weight: 1
                            }}
                        />
                    </>
                )}
            </MapContainer>

            {/* Search Overlay - Top Left */}
            <div className="absolute top-3 left-3 z-[1000] w-[260px] md:w-[320px]">
                <form onSubmit={handleSearch} className="relative group">
                    <input
                        type="text"
                        placeholder="Search location (e.g. Jakarta, Menteng)"
                        className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-md shadow-[0_2px_4px_rgba(0,0,0,0.1)] text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                        {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                    </div>
                </form>
            </div>

            <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur px-3 py-1.5 rounded-md shadow-lg border border-slate-200 pointer-events-none">
                <span className="text-[11px] font-bold text-slate-700">
                    Click map to set location
                </span>
            </div>
        </div>
    )
}
