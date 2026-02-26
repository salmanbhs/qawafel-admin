export type UserRole =
  | "SYSTEM_ADMIN"
  | "TRAVEL_AGENCY_ADMIN"
  | "TRAVEL_AGENCY_STAFF";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  travelAgencyId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  setUser: (user: AuthUser) => void;
  hydrate: () => void | Promise<void>;
}
