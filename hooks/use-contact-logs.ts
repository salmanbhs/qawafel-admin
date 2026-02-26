import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { ContactLog, PaginatedResponse } from "@/types/api";

export function useContactLogs(params?: {
  page?: number;
  limit?: number;
  offerId?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["contact-logs", params],
    queryFn: () =>
      apiGet<PaginatedResponse<ContactLog>>("/contact-logs", {
        page: params?.page || 1,
        limit: params?.limit || 20,
        ...(params?.offerId && { offerId: params.offerId }),
        ...(params?.search && { search: params.search }),
      }),
  });
}

export function useContactLog(id: string) {
  return useQuery({
    queryKey: ["contact-log", id],
    queryFn: () => apiGet<ContactLog>(`/contact-logs/${id}`),
    enabled: !!id,
  });
}
