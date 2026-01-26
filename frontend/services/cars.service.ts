import { authFetch } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const getTagsStats = async () => {
    const res = await authFetch('/cars/admin/tags-stats');
    if (!res.ok) throw new Error('Failed to fetch tags stats');
    return res.json();
};

export const deleteTagWithPenalty = async (tag: string) => {
    const res = await authFetch(`/cars/admin/tags/${encodeURIComponent(tag)}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete tag');
    return res.json();
};

export const editTag = async (category: string, oldTag: string, newTag: string) => {
    const res = await authFetch('/cars/admin/tags', {
        method: 'PATCH',
        body: JSON.stringify({ category, oldTag, newTag }),
    });
    if (!res.ok) throw new Error('Failed to update tag');
    return res.json();
};
