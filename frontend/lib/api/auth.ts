import apiClient from './client';
import type { User } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export const authApi = {
    // Get Google login URL
    getGoogleLoginUrl: () => `${API_URL}/auth/google`,

    // Get current user profile
    getProfile: async (): Promise<User> => {
        const { data } = await apiClient.get<User>('/auth/profile');
        return data;
    },

    // Refresh access token
    refreshToken: async (refreshToken: string): Promise<AuthTokens> => {
        const { data } = await apiClient.post<AuthTokens>('/auth/refresh', { refreshToken });
        return data;
    },

    // Logout (invalidates refresh token on server)
    logout: async (): Promise<void> => {
        await apiClient.post('/auth/logout');
    },
};

export default authApi;

