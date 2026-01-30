import apiClient from './client';
import type { Location, LocationsResponse, CreateLocationDto, UpdateLocationDto, FilterLocationDto } from '@/types';

export const locationsApi = {
    // Get user's locations with filters
    getAll: async (filters?: FilterLocationDto): Promise<LocationsResponse> => {
        const { data } = await apiClient.get<LocationsResponse>('/locations', { params: filters });
        return data;
    },

    // Get public locations
    getPublic: async (filters?: FilterLocationDto): Promise<LocationsResponse> => {
        const { data } = await apiClient.get<LocationsResponse>('/locations/public', { params: filters });
        return data;
    },

    // Get locations by user ID (public timeline)
    getByUser: async (userId: string, filters?: FilterLocationDto): Promise<LocationsResponse> => {
        const { data } = await apiClient.get<LocationsResponse>(`/locations/user/${userId}`, { params: filters });
        return data;
    },

    // Get location by ID
    getById: async (id: string): Promise<Location> => {
        const { data } = await apiClient.get<Location>(`/locations/${id}`);
        return data;
    },

    // Create location with image
    create: async (dto: CreateLocationDto, image?: File): Promise<Location> => {
        const formData = new FormData();
        formData.append('name', dto.name);
        formData.append('latitude', dto.latitude.toString());
        formData.append('longitude', dto.longitude.toString());
        if (dto.note) formData.append('note', dto.note);
        if (dto.categoryId) formData.append('categoryId', dto.categoryId);
        if (dto.isPublic !== undefined) formData.append('isPublic', dto.isPublic.toString());
        if (image) formData.append('image', image);

        const { data } = await apiClient.post<Location>('/locations', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },

    // Update location
    update: async (id: string, dto: UpdateLocationDto, image?: File): Promise<Location> => {
        const formData = new FormData();
        if (dto.name) formData.append('name', dto.name);
        if (dto.latitude !== undefined) formData.append('latitude', dto.latitude.toString());
        if (dto.longitude !== undefined) formData.append('longitude', dto.longitude.toString());
        if (dto.note !== undefined) formData.append('note', dto.note);
        if (dto.categoryId !== undefined) formData.append('categoryId', dto.categoryId);
        if (dto.isPublic !== undefined) formData.append('isPublic', dto.isPublic.toString());
        if (image) formData.append('image', image);

        const { data } = await apiClient.patch<Location>(`/locations/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },

    // Toggle public/private
    togglePublic: async (id: string): Promise<Location> => {
        const { data } = await apiClient.patch<Location>(`/locations/${id}/toggle-public`);
        return data;
    },

    // Delete location
    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/locations/${id}`);
    },

    // Like location
    like: async (id: string): Promise<void> => {
        await apiClient.post(`/locations/${id}/like`);
    },

    // Unlike location
    unlike: async (id: string): Promise<void> => {
        await apiClient.delete(`/locations/${id}/like`);
    },
};

export default locationsApi;
