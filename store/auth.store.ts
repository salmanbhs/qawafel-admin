import { create } from "zustand";
import type { AuthState, AuthUser } from "@/types/auth";
import { refreshTokens } from "@/lib/auth-refresh";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: true,

  /**
   * Persist a new auth session.
   * - accessToken → memory (Zustand) + sessionStorage (same-tab fast access)
   * - refreshToken → localStorage only (survives tab close)
   * - user → localStorage (for quick UI restore on next load)
   * - accessToken is NEVER written to localStorage
   */
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => {
    sessionStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, accessToken, isLoading: false });
  },

  clearAuth: () => {
    sessionStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    set({ user: null, accessToken: null, isLoading: false });
  },

  setUser: (user: AuthUser) => {
    localStorage.setItem("user", JSON.stringify(user));
    set({ user });
  },

  /**
   * Restore session from storage on page load.
   *
   * Strategy:
   * 1. If sessionStorage has an accessToken (same tab, soft reload) → restore instantly.
   * 2. Else if we have a refreshToken → call the refresh endpoint to get a fresh
   *    accessToken. This handles new-tab / hard-reload / cleared sessionStorage.
   * 3. If neither exists → user is truly logged out.
   *
   * The `user` object from localStorage is shown immediately so the UI doesn't
   * flash to login. If the refresh fails, we clear everything and redirect.
   */
  hydrate: async () => {
    if (typeof window === "undefined") return;

    const storedUser = localStorage.getItem("user");
    const sessionToken = sessionStorage.getItem("accessToken");

    // Case 1: sessionStorage has the token (same tab reload)
    if (storedUser && sessionToken) {
      try {
        const user = JSON.parse(storedUser) as AuthUser;
        set({ user, accessToken: sessionToken, isLoading: false });
        return;
      } catch {
        // corrupted user JSON — fall through
      }
    }

    // Case 2: no sessionStorage token but refreshToken exists — obtain fresh access token
    const refreshToken = localStorage.getItem("refreshToken");
    if (storedUser && refreshToken) {
      try {
        const user = JSON.parse(storedUser) as AuthUser;
        // Show user immediately so UI doesn't flash
        set({ user, accessToken: null, isLoading: true });

        const tokens = await refreshTokens();
        if (tokens) {
          set({ user, accessToken: tokens.accessToken, isLoading: false });
        } else {
          // Refresh failed — session is dead
          get().clearAuth();
        }
        return;
      } catch {
        get().clearAuth();
        return;
      }
    }

    // Case 3: nothing stored — user is logged out
    set({ isLoading: false });
  },
}));
