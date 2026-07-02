import { create } from "zustand";
import { persist } from "zustand/middleware";

import { apiClient } from "@/lib/api/client";
import { getAccessToken, setAccessToken } from "@/lib/auth";
import type {
  AuthResponse,
  LoginForm,
  RegisterForm,
  User,
  VerifyMfaLoginForm,
} from "@/types";

function unwrapApiData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") {
    return payload as T;
  }

  if ("data" in payload) {
    return ((payload as { data?: T }).data ?? null) as T | null;
  }

  return payload as T;
}

function resolveStoredAccessToken() {
  if (globalThis.window === undefined) {
    return null;
  }

  return globalThis.window.localStorage.getItem("accessToken");
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  initializeAuth: () => Promise<void>;
  login: (data: LoginForm) => Promise<AuthResponse | void>;
  verifyMfaLogin: (data: VerifyMfaLoginForm) => Promise<void>;
  register: (data: RegisterForm) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  clearError: () => void;
}

export const authStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isInitialized: false,
      isLoading: false,
      error: null,

      initializeAuth: async () => {
        if (get().isInitialized) {
          return;
        }

        const token = getAccessToken() || resolveStoredAccessToken();

        if (token) {
          setAccessToken(token);
        }

        if (!token) {
          set({
            user: null,
            isAuthenticated: false,
            isInitialized: true,
          });
          return;
        }

        try {
          await get().fetchProfile();
        } finally {
          set({ isInitialized: true });
        }
      },

      login: async (data: LoginForm) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.post<unknown>(
            "/api/v1/auth/login",
            data,
          );
          const tokens = unwrapApiData<AuthResponse>(response);

          if (tokens?.mfaRequired && tokens?.challengeToken) {
            set({
              user: null,
              isAuthenticated: false,
              isInitialized: true,
              isLoading: false,
            });
            return tokens;
          }

          setAccessToken(tokens?.accessToken || null);
          await get().fetchProfile();
          set({
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
          });
        } catch (err: any) {
          const message =
            err.response?.data?.error ||
            err.response?.data?.message ||
            "Login failed";
          set({
            error: Array.isArray(message) ? message[0] : message,
            isLoading: false,
          });
          throw err;
        }
      },

      verifyMfaLogin: async (data: VerifyMfaLoginForm) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.post<unknown>(
            "/api/v1/auth/verify-mfa-login",
            data,
          );
          const tokens = unwrapApiData<AuthResponse>(response);

          setAccessToken(tokens?.accessToken || null);
          await get().fetchProfile();
          set({
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
          });
        } catch (err: any) {
          const message =
            err.response?.data?.error ||
            err.response?.data?.message ||
            "Authentication code verification failed";
          set({
            error: Array.isArray(message) ? message[0] : message,
            isLoading: false,
          });
          throw err;
        }
      },

      register: async (data: RegisterForm) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.post<unknown>(
            "/api/v1/auth/register",
            data,
          );
          const tokens = unwrapApiData<AuthResponse>(response);

          setAccessToken(tokens?.accessToken || null);
          await get().fetchProfile();
          set({
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
          });
        } catch (err: any) {
          const message = err.response?.data?.message || "Registration failed";
          set({
            error: Array.isArray(message) ? message[0] : message,
            isLoading: false,
          });
          throw err;
        }
      },

      logout: async () => {
        try {
          await apiClient.post("/api/v1/auth/logout");
        } catch (err) {
          console.error("Logout error:", err);
        } finally {
          setAccessToken(null);
          set({
            user: null,
            isAuthenticated: false,
            isInitialized: true,
            error: null,
          });
        }
      },

      fetchProfile: async () => {
        const token = getAccessToken();

        if (!token) {
          set({
            user: null,
            isAuthenticated: false,
            isInitialized: true,
          });
          return;
        }

        try {
          const response = await apiClient.get<unknown>("/api/v1/auth/profile");
          const user = unwrapApiData<User>(response);

          if (!user) {
            throw new Error("Profile payload missing");
          }

          set({ user, isAuthenticated: true, isInitialized: true });
        } catch (err) {
          setAccessToken(null);
          set({
            user: null,
            isAuthenticated: false,
            isInitialized: true,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
