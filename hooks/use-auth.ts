import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient, setAccessToken, getAccessToken } from '@/lib/api';
import type { User, AuthResponse, LoginForm, RegisterForm } from '@/types';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (data: LoginForm) => Promise<void>;
    register: (data: RegisterForm) => Promise<void>;
    logout: () => Promise<void>;
    fetchProfile: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (data: LoginForm) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await apiClient.post<AuthResponse>('/api/v1/auth/login', data);
                    setAccessToken(response.accessToken);

                    // Fetch user profile after login
                    await get().fetchProfile();

                    set({ isAuthenticated: true, isLoading: false });
                } catch (err: any) {
                    const message = err.response?.data?.message || 'Login failed';
                    set({ error: Array.isArray(message) ? message[0] : message, isLoading: false });
                    throw err;
                }
            },

            register: async (data: RegisterForm) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await apiClient.post<AuthResponse>('/api/v1/auth/register', data);
                    setAccessToken(response.accessToken);

                    // Fetch user profile after registration
                    await get().fetchProfile();

                    set({ isAuthenticated: true, isLoading: false });
                } catch (err: any) {
                    const message = err.response?.data?.message || 'Registration failed';
                    set({ error: Array.isArray(message) ? message[0] : message, isLoading: false });
                    throw err;
                }
            },

            logout: async () => {
                try {
                    await apiClient.post('/api/v1/auth/logout');
                } catch (err) {
                    // Ignore errors on logout
                    console.error('Logout error:', err);
                } finally {
                    setAccessToken(null);
                    set({ user: null, isAuthenticated: false, error: null });
                }
            },

            fetchProfile: async () => {
                const token = getAccessToken();
                if (!token) {
                    set({ user: null, isAuthenticated: false });
                    return;
                }

                try {
                    const user = await apiClient.get<User>('/api/v1/auth/profile');
                    set({ user, isAuthenticated: true });
                } catch (err) {
                    setAccessToken(null);
                    set({ user: null, isAuthenticated: false });
                }
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                // Only persist these fields
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
