import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiPatch, apiDelete, apiPostForm } from "@/lib/api";
import type {
  TravelAgency,
  PaginatedResponse,
  AgencyImageUploadResponse,
} from "@/types/api";

export function useAgencies(params?: { page?: number; limit?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: ["agencies", params],
    queryFn: () =>
      apiGet<PaginatedResponse<TravelAgency>>("/travel-agencies", {
        page: params?.page || 1,
        limit: params?.limit || 20,
      }),
    enabled: params?.enabled !== false, // Disable query by default if enabled is false
  });
}

export function useAgency(id: string) {
  return useQuery({
    queryKey: ["agency", id],
    queryFn: () => apiGet<TravelAgency>(`/travel-agencies/${id}`, {}, { "X-Raw-Response": "true" }),
    enabled: !!id,
  });
}

export function useCreateAgency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TravelAgency>) =>
      apiPost<TravelAgency>("/travel-agencies", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agencies"] });
    },
  });
}

export function useUpdateAgency(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TravelAgency>) =>
      apiPatch<TravelAgency>(`/travel-agencies/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agencies"] });
      qc.invalidateQueries({ queryKey: ["agency", id] });
    },
  });
}

export function useDeleteAgency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/travel-agencies/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agencies"] });
    },
  });
}

export function useUploadAgencyIcon(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      apiPostForm<AgencyImageUploadResponse>(`/travel-agencies/${id}/upload-icon`, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agency", id] });
      qc.invalidateQueries({ queryKey: ["agencies"] });
    },
  });
}

export function useUploadAgencyBanner(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      apiPostForm<AgencyImageUploadResponse>(`/travel-agencies/${id}/upload-banner`, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agency", id] });
      qc.invalidateQueries({ queryKey: ["agencies"] });
    },
  });
}
