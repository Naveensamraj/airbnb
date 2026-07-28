import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const ACCESS_TOKEN_KEY = 'prms_access_token';
const REFRESH_TOKEN_KEY = 'prms_refresh_token';

const env = (import.meta as any).env || (globalThis as any).process?.env || {};

export const api = axios.create({
  baseURL: env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

export interface TokenPair {
  accessToken?: string;
  refreshToken?: string;
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens({ accessToken, refreshToken }: TokenPair): void {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else if (config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      return Promise.reject(error);
    }

    if (!refreshPromise) {
      refreshPromise = axios
        .post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken })
        .then((response) => {
          const tokens = response.data?.data as TokenPair | undefined;
          if (tokens?.accessToken) {
            setTokens(tokens);
            return tokens.accessToken;
          }
          clearTokens();
          return null;
        })
        .catch(() => {
          clearTokens();
          return null;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    const newToken = await refreshPromise;
    if (!newToken) return Promise.reject(error);

    originalRequest._retry = true;
    if (originalRequest.headers && typeof originalRequest.headers.set === 'function') {
      originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
    } else if (originalRequest.headers) {
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
    }
    return api(originalRequest);
  },
);

export function unwrap<T>(response: { data: unknown }): T {
  const payload = response.data as { success?: boolean; message?: string; data?: T };
  if (payload?.success === false) throw new Error(payload.message || 'Request failed');
  return (payload?.data ?? payload) as T;
}

export function toId(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'object') {
    const record = value as { _id?: unknown; id?: unknown };
    return String(record._id || record.id || '');
  }
  return String(value);
}

export function toIsoDate(value: unknown): string {
  if (!value) return '';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().split('T')[0];
}

export function toIsoDateTime(value: unknown): string {
  if (!value) return new Date().toISOString();
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}
