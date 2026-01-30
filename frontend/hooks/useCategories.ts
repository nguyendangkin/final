'use client';

import { useState, useCallback } from 'react';
import { categoriesApi } from '@/lib/api';
import type { Category, CategoryCount, CreateCategoryDto, UpdateCategoryDto } from '@/types';

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [tree, setTree] = useState<Category[]>([]);
    const [counts, setCounts] = useState<CategoryCount[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCategories = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await categoriesApi.getAll();
            setCategories(data);
        } catch {
            setError('Không thể tải danh mục');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchTree = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await categoriesApi.getTree();
            setTree(data);
        } catch {
            setError('Không thể tải cây danh mục');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchCounts = useCallback(async () => {
        try {
            const data = await categoriesApi.getCounts();
            setCounts(data);
        } catch {
            // silently fail
        }
    }, []);

    const createCategory = useCallback(async (dto: CreateCategoryDto) => {
        const newCategory = await categoriesApi.create(dto);
        setCategories((prev) => [...prev, newCategory]);
        return newCategory;
    }, []);

    const updateCategory = useCallback(async (id: string, dto: UpdateCategoryDto) => {
        const updated = await categoriesApi.update(id, dto);
        setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
        return updated;
    }, []);

    const deleteCategory = useCallback(async (id: string) => {
        await categoriesApi.delete(id);
        setCategories((prev) => prev.filter((c) => c.id !== id));
    }, []);

    const getCount = useCallback((categoryId: string) => {
        const found = counts.find((c) => c.categoryId === categoryId);
        return found?.count || 0;
    }, [counts]);

    return {
        categories,
        tree,
        counts,
        isLoading,
        error,
        fetchCategories,
        fetchTree,
        fetchCounts,
        createCategory,
        updateCategory,
        deleteCategory,
        getCount,
    };
}

export default useCategories;
