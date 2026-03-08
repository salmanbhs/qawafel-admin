import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { apiGet } from "@/lib/api";
import type { Hotel, Destination, TravelAgency, PaginatedResponse } from "@/types/api";

// ─── localStorage helpers ───────────────────────────────────────────
const STORAGE_KEYS = {
  agencies: "ref_agencies",
  destinations: "ref_destinations",
  hotels: "ref_hotels",
  cooldown_agencies: "ref_cooldown_agencies",
  cooldown_destinations: "ref_cooldown_destinations",
  cooldown_hotels: "ref_cooldown_hotels",
} as const;

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

function readFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeToStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage full or unavailable — silently skip
  }
}

function removeFromStorage(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

// ─── Cooldown helpers ───────────────────────────────────────────────
function getCooldownRemaining(key: string): number {
  const lastRefresh = readFromStorage<number>(key);
  if (!lastRefresh) return 0;
  const elapsed = Date.now() - lastRefresh;
  return Math.max(0, COOLDOWN_MS - elapsed);
}

function setCooldownTimestamp(key: string) {
  writeToStorage(key, Date.now());
}

// ─── Hooks ──────────────────────────────────────────────────────────

/**
 * Cached agencies — fetched once, persisted in localStorage.
 * Only PUBLISHED agencies are cached.
 */
export function useReferenceAgencies() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["ref_agencies"],
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<TravelAgency>>("/travel-agencies", {
        all: true,
      });
      const data = (res.data ?? []).filter((a) => a.status === "PUBLISHED");
      writeToStorage(STORAGE_KEYS.agencies, data);
      return data;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    initialData: () => readFromStorage<TravelAgency[]>(STORAGE_KEYS.agencies) ?? undefined,
    initialDataUpdatedAt: () => {
      const cached = readFromStorage<TravelAgency[]>(STORAGE_KEYS.agencies);
      return cached ? Date.now() : 0;
    },
  });

  const refresh = useCallback(() => {
    const remaining = getCooldownRemaining(STORAGE_KEYS.cooldown_agencies);
    if (remaining > 0) return remaining;
    removeFromStorage(STORAGE_KEYS.agencies);
    qc.invalidateQueries({ queryKey: ["ref_agencies"] });
    setCooldownTimestamp(STORAGE_KEYS.cooldown_agencies);
    return 0;
  }, [qc]);

  return {
    ...query,
    agencies: query.data ?? [],
    refresh,
    cooldownKey: STORAGE_KEYS.cooldown_agencies,
  };
}

/**
 * Cached destinations — fetched once, persisted in localStorage.
 * Only re-fetches when manually invalidated or on first load with empty cache.
 */
export function useReferenceDestinations() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["ref_destinations"],
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<Destination>>("/destinations", {
        all: true,
      });
      const data = (res.data ?? []).filter((d) => d.status === "ACTIVE");
      writeToStorage(STORAGE_KEYS.destinations, data);
      return data;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    initialData: () => readFromStorage<Destination[]>(STORAGE_KEYS.destinations) ?? undefined,
    initialDataUpdatedAt: () => {
      // If we have localStorage data, treat it as "just now" so it's never stale
      const cached = readFromStorage<Destination[]>(STORAGE_KEYS.destinations);
      return cached ? Date.now() : 0;
    },
  });

  const refresh = useCallback(() => {
    const remaining = getCooldownRemaining(STORAGE_KEYS.cooldown_destinations);
    if (remaining > 0) return remaining;
    removeFromStorage(STORAGE_KEYS.destinations);
    qc.invalidateQueries({ queryKey: ["ref_destinations"] });
    setCooldownTimestamp(STORAGE_KEYS.cooldown_destinations);
    return 0;
  }, [qc]);

  return {
    ...query,
    destinations: query.data ?? [],
    refresh,
    cooldownKey: STORAGE_KEYS.cooldown_destinations,
  };
}

/**
 * Cached hotels — fetched once with all hotels, persisted in localStorage.
 * Filtered client-side by destinationIds when needed.
 */
export function useReferenceHotels() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["ref_hotels"],
    queryFn: async () => {
      const res = await apiGet<PaginatedResponse<Hotel>>("/hotels", {
        all: true,
      });
      const data = (res.data ?? []).filter((h) => h.status === "ACTIVE");
      writeToStorage(STORAGE_KEYS.hotels, data);
      return data;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    initialData: () => readFromStorage<Hotel[]>(STORAGE_KEYS.hotels) ?? undefined,
    initialDataUpdatedAt: () => {
      const cached = readFromStorage<Hotel[]>(STORAGE_KEYS.hotels);
      return cached ? Date.now() : 0;
    },
  });

  const refresh = useCallback(() => {
    const remaining = getCooldownRemaining(STORAGE_KEYS.cooldown_hotels);
    if (remaining > 0) return remaining;
    removeFromStorage(STORAGE_KEYS.hotels);
    qc.invalidateQueries({ queryKey: ["ref_hotels"] });
    setCooldownTimestamp(STORAGE_KEYS.cooldown_hotels);
    return 0;
  }, [qc]);

  return {
    ...query,
    allHotels: query.data ?? [],
    refresh,
    cooldownKey: STORAGE_KEYS.cooldown_hotels,
  };
}

/**
 * Invalidate reference caches — call after creating/updating hotels or destinations.
 */
export function useInvalidateReferenceData() {
  const qc = useQueryClient();

  const invalidateDestinations = useCallback(() => {
    removeFromStorage(STORAGE_KEYS.destinations);
    qc.invalidateQueries({ queryKey: ["ref_destinations"] });
  }, [qc]);

  const invalidateHotels = useCallback(() => {
    removeFromStorage(STORAGE_KEYS.hotels);
    qc.invalidateQueries({ queryKey: ["ref_hotels"] });
  }, [qc]);

  return { invalidateDestinations, invalidateHotels };
}

/**
 * Get cooldown remaining in ms for a given key.
 */
export { getCooldownRemaining, COOLDOWN_MS };

/**
 * Clear localStorage cache — call from mutation onSuccess handlers.
 */
export function clearReferenceCache(type: "agencies" | "hotels" | "destinations") {
  removeFromStorage(STORAGE_KEYS[type]);
}
