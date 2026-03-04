import axios, { AxiosError } from "axios";
import { refreshTokens } from "@/lib/auth-refresh";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: BASE_URL,
  paramsSerializer: (params) => {
    const searchParams = new URLSearchParams();
    for (const key in params) {
      const value = params[key];
      if (Array.isArray(value)) {
        // For arrays, add multiple params with the same key: key=val1&key=val2
        value.forEach((v) => searchParams.append(key, String(v)));
      } else if (value !== null && value !== undefined) {
        searchParams.set(key, String(value));
      }
    }
    return searchParams.toString();
  },
});

// ─── Request interceptor — attach access token ───────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = sessionStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // Forward Accept-Language so API returns localised field names
    const locale = localStorage.getItem("locale") || "ar";
    config.headers["Accept-Language"] = locale === "ar" ? "ar" : "en";

    // For FormData, ensure Content-Type is not set so axios auto-detects with boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else {
      // For JSON requests, explicitly set application/json
      if (!config.headers["Content-Type"]) {
        config.headers["Content-Type"] = "application/json";
      }
    }
  }
  return config;
});

// ─── Response interceptor — auto-refresh on 401 ──────────────────────────────
// Uses the shared refreshTokens() mutex so concurrent 401s don't cause
// multiple refresh calls (which would fail with token rotation).
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;

      const tokens = await refreshTokens();

      if (tokens) {
        // Update Zustand store if available (safe import to avoid circular deps)
        try {
          const { useAuthStore } = await import("@/store/auth.store");
          const state = useAuthStore.getState();
          if (state.user) {
            state.setAuth(state.user, tokens.accessToken, tokens.refreshToken);
          }
        } catch {
          // Store not available — sessionStorage was already updated by refreshTokens()
        }

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }
        return api(originalRequest);
      }

      // Refresh failed — clear everything and redirect via Next.js-friendly navigation
      sessionStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      const locale = localStorage.getItem("locale") || "ar";
      window.location.href = `/${locale}/login`;
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export default api;

// ─── Typed helpers ────────────────────────────────────────────────────────────
export async function apiGet<T>(url: string, params?: Record<string, unknown>, headers?: Record<string, string>) {
  const res = await api.get<{ success: boolean; data: T }>(url, { params, headers });
  return res.data.data;
}

export async function apiPost<T>(url: string, body?: unknown) {
  const res = await api.post<{ success: boolean; data: T }>(url, body);
  return res.data.data;
}

export async function apiPatch<T>(url: string, body?: unknown) {
  const res = await api.patch<{ success: boolean; data: T }>(url, body);
  return res.data.data;
}

export async function apiDelete<T>(url: string) {
  const res = await api.delete<{ success: boolean; data: T }>(url);
  return res.data.data;
}

export async function apiPostForm<T>(url: string, form: FormData) {
  const res = await api.post<{ success: boolean; data: T }>(url, form);
  return res.data.data;
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred"
    );
  }
  return "An unexpected error occurred";
}
