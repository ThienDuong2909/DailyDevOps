import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

// Create axios instance
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Send cookies with requests
});

// Token management
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
    accessToken = token;
    if (token) {
        localStorage.setItem('accessToken', token);
    } else {
        localStorage.removeItem('accessToken');
    }
};

export const getAccessToken = (): string | null => {
    if (accessToken) return accessToken;
    if (typeof window !== 'undefined') {
        accessToken = localStorage.getItem('accessToken');
    }
    return accessToken;
};

// Request interceptor - add auth token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getAccessToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Wait for the refresh to complete
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Try to refresh the token
                const response = await api.post('/api/v1/auth/refresh');
                const { accessToken: newToken } = response.data;

                setAccessToken(newToken);
                processQueue(null, newToken);

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                }

                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError as Error, null);
                setAccessToken(null);

                // Redirect to login if refresh fails
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;

// Typed API methods
export const apiClient = {
    get: <T>(url: string, config?: AxiosRequestConfig) =>
        api.get<T>(url, config).then((res) => res.data),

    post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
        api.post<T>(url, data, config).then((res) => res.data),

    put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
        api.put<T>(url, data, config).then((res) => res.data),

    patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
        api.patch<T>(url, data, config).then((res) => res.data),

    delete: <T>(url: string, config?: AxiosRequestConfig) =>
        api.delete<T>(url, config).then((res) => res.data),
};
