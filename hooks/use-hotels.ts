import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { clearReferenceCache } from "@/hooks/use-reference-data";
import type { Hotel, PaginatedResponse } from "@/types/api";

export function useHotels(params?: {
  page?: number;
  limit?: number;
  travelAgencyId?: string;
  destinationId?: string;
  destinationIds?: string[];
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["hotels", params],
    queryFn: () => {
      const queryParams: Record<string, any> = {
        page: params?.page || 1,
        limit: params?.limit || 20,
      };

      // Add single destinationId if provided
      if (params?.destinationId) {
        queryParams.destinationId = params.destinationId;
      }

      // Add multiple destinationIds if provided
      if (params?.destinationIds && params.destinationIds.length > 0) {
        queryParams.destinationId = params.destinationIds;
      }

      return apiGet<PaginatedResponse<Hotel>>("/hotels", queryParams);
    },
    enabled: params?.enabled !== false, // Disable query by default if enabled is false
    placeholderData: keepPreviousData,
  });
}

export function useHotel(id: string) {
  return useQuery({
    queryKey: ["hotel", id],
    queryFn: () => apiGet<Hotel>(`/hotels/${id}`, {}, { "X-Raw-Response": "true" }),
    enabled: !!id,
  });
}

export function useCreateHotel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Hotel>) => apiPost<Hotel>("/hotels", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hotels"] });
      clearReferenceCache("hotels");
      qc.invalidateQueries({ queryKey: ["ref_hotels"] });
    },
  });
}

export function useUpdateHotel(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Hotel>) =>
      apiPatch<Hotel>(`/hotels/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hotels"] });
      qc.invalidateQueries({ queryKey: ["hotel", id] });
      clearReferenceCache("hotels");
      qc.invalidateQueries({ queryKey: ["ref_hotels"] });
    },
  });
}

export function useDeleteHotel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/hotels/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hotels"] });
      clearReferenceCache("hotels");
      qc.invalidateQueries({ queryKey: ["ref_hotels"] });
    },
  });
}
