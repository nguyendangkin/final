import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { authApi } from '@/lib/api';

interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    setTokens: (token: string, refreshToken: string) => void;
    setUser: (user: User | null) => void;
    fetchUser: () => Promise<void>;
    logout: () => Promise<void>;
    updateAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            refreshToken: null,
            isLoading: false,
            isAuthenticated: false,

            setTokens: (token: string, refreshToken: string) => {
                localStorage.setItem('token', token);
                localStorage.setItem('refreshToken', refreshToken);
                set({ token, refreshToken, isAuthenticated: true });
            },

            updateAccessToken: (token: string) => {
                localStorage.setItem('token', token);
                set({ token });
            },

            setUser: (user: User | null) => {
                set({ user, isAuthenticated: !!user });
            },

            fetchUser: async () => {
                const token = get().token || localStorage.getItem('token');
                if (!token) {
                    set({ user: null, isAuthenticated: false, isLoading: false });
                    return;
                }

                set({ isLoading: true });
                try {
                    const user = await authApi.getProfile();
                    set({ user, isAuthenticated: true, isLoading: false });
                } catch {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
                }
            },

            logout: async () => {
                try {
                    // Call backend to invalidate refresh token
                    await authApi.logout();
                } catch {
                    // Ignore errors, still clear local state
                }
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('auth-storage');
                set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token, refreshToken: state.refreshToken }),
        }
    )
);

export default useAuthStore;

