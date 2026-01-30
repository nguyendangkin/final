'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useLocations, useCategories, useGeolocation } from '@/hooks';
import { useAuthStore } from '@/lib/stores';
import { Spinner } from '@/components/ui';
import type { Location, Category } from '@/types';

const MapView = dynamic(() => import('@/components/map/MapView').then(mod => mod.MapView), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <Spinner size="lg" />
        </div>
    ),
});

interface MapPersistenceContextType {
    locations: Location[];
    categories: Category[];
    isLoading: boolean;
    latitude: number | null;
    longitude: number | null;
    mapCenter: [number, number] | null;
    setMapCenter: (center: [number, number]) => void;
    filteredLocations: Location[];
    setFilteredLocations: (locations: Location[]) => void;
    gpsLoading: boolean;
    getCurrentPosition: () => void;
    fetchLocations: () => void;
    fetchCategories: () => void;
}

const MapPersistenceContext = createContext<MapPersistenceContextType | null>(null);

export function useMapPersistence() {
    const context = useContext(MapPersistenceContext);
    if (!context) {
        throw new Error('useMapPersistence must be used within MapPersistenceProvider');
    }
    return context;
}

interface MapPersistenceProviderProps {
    children: ReactNode;
}

export function MapPersistenceProvider({ children }: MapPersistenceProviderProps) {
    const pathname = usePathname();
    const isHomePage = pathname === '/';
    const { isAuthenticated } = useAuthStore();

    const { locations, isLoading, fetchLocations } = useLocations();
    const { categories, fetchCategories } = useCategories();
    const {
        latitude,
        longitude,
        getCurrentPosition,
        startWatching,
        stopWatching,
        isLoading: gpsLoading,
        error: gpsError,
    } = useGeolocation();

    const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
    const [mapReady, setMapReady] = useState(false);
    const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);

    // Initial data fetch (only when authenticated)
    useEffect(() => {
        if (isAuthenticated) {
            fetchLocations();
            fetchCategories();
        }
    }, [isAuthenticated, fetchLocations, fetchCategories]);

    // Sync filtered locations with all locations initially
    useEffect(() => {
        setFilteredLocations(locations);
    }, [locations]);

    // GPS tracking: start when on home, stop when leaving (battery saving)
    useEffect(() => {
        if (isHomePage) {
            startWatching();
        } else {
            stopWatching();
        }

        return () => {
            stopWatching();
        };
    }, [isHomePage, startWatching, stopWatching]);

    // Set map center when GPS is available
    useEffect(() => {
        if (latitude && longitude && !mapReady) {
            setMapCenter([latitude, longitude]);
            setMapReady(true);
        } else if (latitude && longitude && mapReady) {
            // Update center when GPS updates (realtime)
            // Only update if user hasn't manually moved the map
        }
    }, [latitude, longitude, mapReady]);

    // Fallback: if GPS fails or takes too long
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (!mapReady && locations.length > 0) {
                const firstLoc = locations[0];
                setMapCenter([firstLoc.latitude, firstLoc.longitude]);
                setMapReady(true);
            } else if (!mapReady && gpsError) {
                setMapCenter([10.8231, 106.6297]); // Default HCM
                setMapReady(true);
            }
        }, 2000);
        return () => clearTimeout(timeout);
    }, [locations, mapReady, gpsError]);

    const contextValue = useMemo(() => ({
        locations,
        categories,
        isLoading,
        latitude,
        longitude,
        mapCenter,
        setMapCenter,
        filteredLocations,
        setFilteredLocations,
        gpsLoading,
        getCurrentPosition,
        fetchLocations,
        fetchCategories,
    }), [locations, categories, isLoading, latitude, longitude, mapCenter, filteredLocations, gpsLoading, getCurrentPosition, fetchLocations, fetchCategories]);

    return (
        <MapPersistenceContext.Provider value={contextValue}>
            {/* Persistent Map Layer - always rendered, visibility controlled by CSS */}
            <div
                style={{
                    position: 'fixed',
                    top: '56px', // Below navbar
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: isHomePage ? 0 : -1,
                    visibility: isHomePage ? 'visible' : 'hidden',
                    pointerEvents: isHomePage ? 'auto' : 'none',
                }}
            >
                {mapCenter ? (
                    <MapView
                        locations={filteredLocations}
                        center={mapCenter}
                        zoom={18}
                        userLocation={latitude && longitude ? [latitude, longitude] : null}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <Spinner size="lg" />
                    </div>
                )}
            </div>

            {children}
        </MapPersistenceContext.Provider>
    );
}

export default MapPersistenceProvider;
