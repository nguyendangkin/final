'use client';

import { useState, useCallback } from 'react';
import { locationsApi } from '@/lib/api';
import type { Location, LocationsResponse, CreateLocationDto, UpdateLocationDto, FilterLocationDto } from '@/types';

export function useLocations() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [meta, setMeta] = useState<LocationsResponse['meta'] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLocations = useCallback(async (filters?: FilterLocationDto) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await locationsApi.getAll(filters);
            if (filters?.page && filters.page > 1) {
                // Append new data and deduplicate by ID to prevent React key errors
                setLocations((prev) => {
                    const combined = [...prev, ...response.data];
                    const uniqueMap = new Map(combined.map(loc => [loc.id, loc]));
                    return Array.from(uniqueMap.values());
                });
            } else {
                setLocations(response.data);
            }
            setMeta(response.meta);
        } catch {
            setError('Không thể tải địa điểm');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchPublicLocations = useCallback(async (filters?: FilterLocationDto) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await locationsApi.getPublic(filters);
            if (filters?.page && filters.page > 1) {
                setLocations((prev) => {
                    const combined = [...prev, ...response.data];
                    const uniqueMap = new Map(combined.map(loc => [loc.id, loc]));
                    return Array.from(uniqueMap.values());
                });
            } else {
                setLocations(response.data);
            }
            setMeta(response.meta);
        } catch {
            setError('Không thể tải địa điểm công khai');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchByUser = useCallback(async (userId: string, filters?: FilterLocationDto) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await locationsApi.getByUser(userId, filters);
            if (filters?.page && filters.page > 1) {
                setLocations((prev) => {
                    const combined = [...prev, ...response.data];
                    const uniqueMap = new Map(combined.map(loc => [loc.id, loc]));
                    return Array.from(uniqueMap.values());
                });
            } else {
                setLocations(response.data);
            }
            setMeta(response.meta);
        } catch {
            setError('Không thể tải địa điểm của người dùng');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createLocation = useCallback(async (dto: CreateLocationDto, image?: File) => {
        const newLocation = await locationsApi.create(dto, image);
        setLocations((prev) => [newLocation, ...prev]);
        return newLocation;
    }, []);

    const updateLocation = useCallback(async (id: string, dto: UpdateLocationDto, image?: File) => {
        const updated = await locationsApi.update(id, dto, image);
        setLocations((prev) => prev.map((l) => (l.id === id ? updated : l)));
        return updated;
    }, []);

    const togglePublic = useCallback(async (id: string) => {
        const updated = await locationsApi.togglePublic(id);
        setLocations((prev) => prev.map((l) => (l.id === id ? updated : l)));
        return updated;
    }, []);

    const deleteLocation = useCallback(async (id: string) => {
        await locationsApi.delete(id);
        setLocations((prev) => prev.filter((l) => l.id !== id));
    }, []);

    const likeLocation = useCallback(async (id: string) => {
        await locationsApi.like(id);
        setLocations((prev) =>
            prev.map((l) =>
                l.id === id ? { ...l, isLiked: true, likeCount: (l.likeCount || 0) + 1 } : l
            )
        );
    }, []);

    const unlikeLocation = useCallback(async (id: string) => {
        await locationsApi.unlike(id);
        setLocations((prev) =>
            prev.map((l) =>
                l.id === id ? { ...l, isLiked: false, likeCount: Math.max((l.likeCount || 0) - 1, 0) } : l
            )
        );
    }, []);

    const hasMore = meta ? meta.page < meta.totalPages : false;

    return {
        locations,
        meta,
        isLoading,
        error,
        hasMore,
        fetchLocations,
        fetchPublicLocations,
        fetchByUser,
        createLocation,
        updateLocation,
        togglePublic,
        deleteLocation,
        likeLocation,
        unlikeLocation,
    };
}

export default useLocations;
