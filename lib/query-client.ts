import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,           // 5 minutes before refetch
      gcTime: 10 * 60 * 1000,             // Keep cache 10min (was default 5min)
      retry: 1,                           // Retry once on failure
      refetchOnWindowFocus: false,        // Don't refetch on tab focus
      refetchIntervalInBackground: false, // Don't refetch in background tabs
    },
    mutations: {
      retry: 0,
    },
  },
});
