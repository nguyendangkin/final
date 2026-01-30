'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Location } from '@/types';

// Fix for default markers in Next.js
const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface MapProps {
    locations: Location[];
    center?: [number, number];
    zoom?: number;
    userLocation?: [number, number] | null;
    onMarkerClick?: (location: Location) => void;
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

export function MapView({ locations, center = [10.8231, 106.6297], zoom = 13, userLocation, onMarkerClick }: MapProps) {
    // Using a simple hydration check - standard pattern for client-only components in Next.js
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <div className="text-gray-500">Đang tải bản đồ...</div>
            </div>
        );
    }

    const createColoredIcon = (color: string, icon?: string) => {
        return L.divIcon({
            className: 'custom-marker',
            html: `<div style="
        background-color: ${color || '#0d9488'};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      ">${icon || ''}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16],
        });
    };

    // User location marker with pulsing animation
    const userLocationIcon = L.divIcon({
        className: 'user-location-marker',
        html: `
            <div style="position: relative; width: 24px; height: 24px;">
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 24px;
                    height: 24px;
                    background-color: rgba(59, 130, 246, 0.3);
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                "></div>
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 14px;
                    height: 14px;
                    background-color: #3b82f6;
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                "></div>
            </div>
            <style>
                @keyframes pulse {
                    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
                }
            </style>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            zoomControl={false}
            className="w-full h-full"
            style={{ height: '100%', width: '100%' }}
        >
            <ChangeView center={center} zoom={zoom} />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* User Location Marker */}
            {userLocation && (
                <Marker
                    position={userLocation}
                    icon={userLocationIcon}
                    zIndexOffset={1000}
                >
                    <Popup>
                        <div className="text-center">
                            <div className="font-semibold text-blue-600">📍 Vị trí của bạn</div>
                        </div>
                    </Popup>
                </Marker>
            )}
            {locations.map((location) => (
                <Marker
                    key={location.id}
                    position={[location.latitude, location.longitude]}
                    icon={createColoredIcon(location.category?.iconColor || '#0d9488', location.category?.icon || undefined)}
                    eventHandlers={{
                        click: () => onMarkerClick?.(location),
                    }}
                >
                    <Popup>
                        <div className="min-w-[200px]">
                            {location.image && (
                                // eslint-disable-next-line @next/next/no-img-element -- Leaflet popup DOM doesn't support React components
                                <img
                                    src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${location.image}`}
                                    alt={location.name}
                                    className="w-full h-24 object-cover rounded-lg mb-2"
                                />
                            )}
                            <h3 className="font-semibold text-gray-900">{location.name}</h3>
                            {location.category && (
                                <span
                                    className="inline-block px-2 py-0.5 text-xs rounded-full mt-1"
                                    style={{
                                        backgroundColor: `${location.category.iconColor}20`,
                                        color: location.category.iconColor || '#0d9488'
                                    }}
                                >
                                    {location.category.name}
                                </span>
                            )}
                            {location.note && (
                                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{location.note}</p>
                            )}
                            <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mt-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
                            >
                                Mở Google Maps →
                            </a>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}

export default MapView;
