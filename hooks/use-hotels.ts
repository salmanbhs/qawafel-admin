import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type { Hotel, PaginatedResponse } from "@/types/api";

export function useHotels(params?: {
  page?: number;
  limit?: number;
  travelAgencyId?: string;
  destinationId?: string;
}) {
  return useQuery({
    queryKey: ["hotels", params],
    queryFn: () =>
      apiGet<PaginatedResponse<Hotel>>("/hotels", {
        page: params?.page || 1,
        limit: params?.limit || 20,
        ...(params?.travelAgencyId && { travelAgencyId: params.travelAgencyId }),
        ...(params?.destinationId && { destinationId: params.destinationId }),
      }),
  });
}

export function useHotel(id: string) {
  return useQuery({
    queryKey: ["hotel", id],
    queryFn: () => apiGet<Hotel>(`/hotels/${id}`),
    enabled: !!id,
  });
}

export function useCreateHotel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Hotel>) => apiPost<Hotel>("/hotels", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hotels"] });
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
    },
  });
}

export function useDeleteHotel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/hotels/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hotels"] });
    },
  });
}
