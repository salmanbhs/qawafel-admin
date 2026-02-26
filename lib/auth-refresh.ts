/**
 * Centralized token refresh with mutex.
 *
 * Why a mutex?
 * If 3 API calls return 401 at the same time, without a mutex each would
 * independently call POST /auth/refresh. If the backend rotates refresh tokens
 * (security best-practice), the 2nd and 3rd calls fail because the first
 * one already consumed the old refresh token → user gets logged out for no reason.
 *
 * With a mutex, only the first caller actually hits the API; the others
 * await the same Promise and all receive the new token.
 */

import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

let inflightRefresh: Promise<{
  accessToken: string;
  refreshToken: string;
}> | null = null;

/**
 * Perform a token refresh. Safe to call concurrently — only one network
 * request will be made at a time; subsequent callers share the same Promise.
 */
export async function refreshTokens(): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  // If a refresh is already in-flight, piggy-back on it
  if (inflightRefresh) {
    try {
      return await inflightRefresh;
    } catch {
      return null;
    }
  }

  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  inflightRefresh = (async () => {
    try {
      // Use raw axios (not the `api` instance) to avoid triggering
      // our own interceptor and creating an infinite loop.
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const tokens = {
        accessToken: data.data.accessToken as string,
        refreshToken: data.data.refreshToken as string,
      };

      // Persist — accessToken in sessionStorage only (NOT localStorage),
      // refreshToken in localStorage.
      sessionStorage.setItem("accessToken", tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);

      return tokens;
    } finally {
      // Always clear so the next call can start a fresh refresh
      inflightRefresh = null;
    }
  })();

  try {
    return await inflightRefresh;
  } catch {
    return null;
  }
}
