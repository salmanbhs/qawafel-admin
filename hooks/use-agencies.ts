import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiPatch, apiDelete, apiPostForm } from "@/lib/api";
import { clearReferenceCache } from "@/hooks/use-reference-data";
import type {
  TravelAgency,
  PaginatedResponse,
  AgencyImageUploadResponse,
} from "@/types/api";

export function useAgencies(params?: { page?: number; limit?: number; search?: string; phone?: string; instagram?: string; enabled?: boolean }) {
  return useQuery({
    queryKey: ["agencies", params],
    queryFn: () =>
      apiGet<PaginatedResponse<TravelAgency>>("/travel-agencies", {
        page: params?.page || 1,
        limit: params?.limit || 20,
        ...(params?.search && { search: params.search }),
        ...(params?.phone && { phone: params.phone }),
        ...(params?.instagram && { instagram: params.instagram }),
      }),
    enabled: params?.enabled !== false, // Disable query by default if enabled is false
    placeholderData: keepPreviousData,
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
      clearReferenceCache("agencies");
      qc.invalidateQueries({ queryKey: ["ref_agencies"] });
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
      clearReferenceCache("agencies");
      qc.invalidateQueries({ queryKey: ["ref_agencies"] });
    },
  });
}

export function useDeleteAgency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/travel-agencies/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agencies"] });
      clearReferenceCache("agencies");
      qc.invalidateQueries({ queryKey: ["ref_agencies"] });
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
