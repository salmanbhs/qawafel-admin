"use client";

import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "@/lib/query-client";
import { useAuthStore } from "@/store/auth.store";

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    // hydrate() is async (may call /auth/refresh) — fire-and-forget is safe
    // because it updates Zustand state when done, triggering re-renders.
    void hydrate();
  }, [hydrate]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          classNames: {
            toast: "font-sans",
          },
        }}
      />
    </QueryClientProvider>
  );
}
