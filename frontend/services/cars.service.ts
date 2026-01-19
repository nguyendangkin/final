const API_URL = 'http://localhost:3000';

export const getTagsStats = async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) throw new Error('No token found');

    const res = await fetch(`${API_URL}/cars/admin/tags-stats`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!res.ok) throw new Error('Failed to fetch tags stats');
    return res.json();
};

export const deleteTagWithPenalty = async (tag: string) => {
    const token = localStorage.getItem('jwt_token');
    if (!token) throw new Error('No token found');

    const res = await fetch(`${API_URL}/cars/admin/tags/${encodeURIComponent(tag)}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!res.ok) throw new Error('Failed to delete tag');
    return res.json();
};
