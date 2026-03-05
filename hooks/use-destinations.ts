import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete, apiPostForm } from "@/lib/api";
import type { Destination, PaginatedResponse, DestinationImageUploadResponse } from "@/types/api";

export function useDestinations(params?: { page?: number; limit?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: ["destinations", params],
    queryFn: () =>
      apiGet<PaginatedResponse<Destination>>("/destinations", {
        page: params?.page || 1,
        limit: params?.limit || 20,
      }),
    enabled: params?.enabled !== false, // Disable query by default if enabled is false
  });
}

export function useDestination(id: string) {
  return useQuery({
    queryKey: ["destination", id],
    queryFn: () => apiGet<Destination>(`/destinations/${id}`, {}, { "X-Raw-Response": "true" }),
    enabled: !!id,
  });
}

export function useCreateDestination() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Destination>) => apiPost<Destination>("/destinations", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["destinations"] }); },
  });
}

export function useUpdateDestination(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Destination>) => apiPatch<Destination>(`/destinations/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["destinations"] });
      qc.invalidateQueries({ queryKey: ["destination", id] });
    },
  });
}

export function useDeleteDestination() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/destinations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["destinations"] });
    },
  });
}

export function useUploadDestinationIcon(destinationId: string) {
  return useMutation({
    mutationFn: (formData: FormData) =>
      apiPostForm<DestinationImageUploadResponse>(`/destinations/${destinationId}/upload-icon`, formData),
  });
}

export function useUploadDestinationBanner(destinationId: string) {
  return useMutation({
    mutationFn: (formData: FormData) =>
      apiPostForm<DestinationImageUploadResponse>(`/destinations/${destinationId}/upload-banner`, formData),
  });
}
