/**
 * auxin-frontend/src/lib/api.ts
 * --------------------------------
 * Axios HTTP client for the Auxin backend API.
 *
 * v2.0 changes:
 *  - Token injection now reads from Supabase session (not localStorage).
 *  - 401 handler calls supabase.auth.refreshSession() instead of the old
 *    /auth/refresh-token endpoint.
 *  - Demo token detection and offline fallback logic removed.
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// ---------------------------------------------------------------------------
// Request interceptor — attach Supabase access token
// ---------------------------------------------------------------------------

import { useAuthStore } from "@/store/authStore";

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const { data } = await supabase.auth.getSession();
  let token: string | undefined = data.session?.access_token || undefined;
  if (!token) {
    token = useAuthStore.getState().token || undefined;
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor — auto-refresh on 401
// ---------------------------------------------------------------------------

let _refreshing = false;
let _refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
  _refreshSubscribers.forEach((cb) => cb(token));
  _refreshSubscribers = [];
}

/** Lazy-import appStore to avoid SSR circular dependency */
async function setColdStart(value: boolean) {
  try {
    if (typeof window === "undefined") return; // SSR guard
    const { useAppStore } = await import("@/store/appStore");
    useAppStore.getState().setColdStart(value);
  } catch {
    // Non-critical — store may be unavailable
  }
}

api.interceptors.response.use(
  (response) => {
    // Successful response — clear cold-start state
    setColdStart(false);
    return response;
  },
  async (error) => {
    const originalRequest: AxiosRequestConfig & { _retry?: boolean } = error.config ?? {};

    // Cold-start detection: Render free-tier returns 503 while waking up
    const is503     = error.response?.status === 503;
    const isTimeout = error.code === "ECONNABORTED" || error.code === "ERR_NETWORK";
    if ((is503 || isTimeout) && !originalRequest._retry) {
      setColdStart(true);
      await new Promise((r) => setTimeout(r, 3000)); // wait 3s for backend to wake
      originalRequest._retry = true;
      return api(originalRequest);
    }
    
    // Clear cold-start for any other error or completed retry
    setColdStart(false);

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (_refreshing) {
        return new Promise((resolve) => {
          _refreshSubscribers.push((token) => {
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${token}`,
            };
            resolve(api(originalRequest));
          });
        });
      }

      _refreshing = true;
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      _refreshing = false;

      if (refreshError || !data.session) {
        await supabase.auth.signOut();
        return Promise.reject(error);
      }

      onRefreshed(data.session.access_token);
      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${data.session.access_token}`,
      };
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

export { api };
export default api;


// ---------------------------------------------------------------------------
// Error message extractor
// ---------------------------------------------------------------------------

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object" &&
    (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
  ) {
    return (error as { response: { data: { detail: string } } }).response.data.detail;
  }
  return "An unexpected error occurred.";
}
