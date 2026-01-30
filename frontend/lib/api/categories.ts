import apiClient from './client';
import type { Category, CreateCategoryDto, UpdateCategoryDto, CategoryCount } from '@/types';

export const categoriesApi = {
    // Get all categories
    getAll: async (): Promise<Category[]> => {
        const { data } = await apiClient.get<Category[]>('/categories');
        return data;
    },

    // Get category tree
    getTree: async (): Promise<Category[]> => {
        const { data } = await apiClient.get<Category[]>('/categories/tree');
        return data;
    },

    // Get category by ID
    getById: async (id: string): Promise<Category> => {
        const { data } = await apiClient.get<Category>(`/categories/${id}`);
        return data;
    },

    // Get location counts per category
    getCounts: async (): Promise<CategoryCount[]> => {
        const { data } = await apiClient.get<CategoryCount[]>('/categories/counts');
        return data;
    },

    // Create category
    create: async (dto: CreateCategoryDto): Promise<Category> => {
        const { data } = await apiClient.post<Category>('/categories', dto);
        return data;
    },

    // Update category
    update: async (id: string, dto: UpdateCategoryDto): Promise<Category> => {
        const { data } = await apiClient.patch<Category>(`/categories/${id}`, dto);
        return data;
    },

    // Delete category
    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/categories/${id}`);
    },
};

export default categoriesApi;
