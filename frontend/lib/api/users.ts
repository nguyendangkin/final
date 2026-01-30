import apiClient from './client';

export interface PublicUser {
    id: string;
    displayName: string;
    avatar: string | null;
    createdAt: string;
}

export const usersApi = {
    getPublic: async (userId: string): Promise<PublicUser> => {
        const { data } = await apiClient.get<PublicUser>(`/users/${userId}/public`);
        return data;
    },
};

export default usersApi;
