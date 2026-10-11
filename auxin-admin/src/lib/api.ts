/**
 * auxin-admin/src/lib/api.ts
 * ----------------------------
 * Axios HTTP client for admin dashboard - Supabase session for token injection.
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { supabase } from "@/lib/supabase";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return config;
});

let _refreshing = false;
let _subscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
  _subscribers.forEach((cb) => cb(token));
  _subscribers = [];
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original: AxiosRequestConfig & { _retry?: boolean } = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (_refreshing) {
        return new Promise((resolve) => {
          _subscribers.push((token) => {
            original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
            resolve(api(original));
          });
        });
      }

      _refreshing = true;
      const { data, error: e } = await supabase.auth.refreshSession();
      _refreshing = false;

      if (e || !data.session) {
        await supabase.auth.signOut();
        return Promise.reject(error);
      }

      onRefreshed(data.session.access_token);
      original.headers = { ...original.headers, Authorization: `Bearer ${data.session.access_token}` };
      return api(original);
    }

    return Promise.reject(error);
  }
);

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
