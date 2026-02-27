import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete, apiPostForm } from "@/lib/api";
import type { Package, PaginatedResponse, PackageImageUploadResponse } from "@/types/api";

export function usePackages(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["packages", params],
    queryFn: () =>
      apiGet<PaginatedResponse<Package>>("/packages", {
        page: params?.page || 1,
        limit: params?.limit || 20,
      }),
  });
}

export function usePackage(id: string) {
  return useQuery({
    queryKey: ["package", id],
    queryFn: () => apiGet<Package>(`/packages/${id}`, {}, { "X-Raw-Response": "true" }),
    enabled: !!id,
  });
}

export function useCreatePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Package>) => apiPost<Package>("/packages", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["packages"] }); },
  });
}

export function useUpdatePackage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Package>) => apiPatch<Package>(`/packages/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["packages"] });
      qc.invalidateQueries({ queryKey: ["package", id] });
    },
  });
}

export function useDeletePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/packages/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["packages"] });
    },
  });
}

export function useUploadPackageIcon() {
  return useMutation({
    mutationFn: (formData: FormData) =>
      apiPostForm<PackageImageUploadResponse>("/packages/upload-icon", formData),
  });
}

export function useUploadPackageBanner() {
  return useMutation({
    mutationFn: (formData: FormData) =>
      apiPostForm<PackageImageUploadResponse>("/packages/upload-banner", formData),
  });
}

export function useAddPackageDestination(packageId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (destinationId: string) =>
      apiPost(`/packages/${packageId}/destinations`, { destinationId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["package", packageId] });
    },
  });
}

export function useRemovePackageDestination(packageId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (destinationId: string) =>
      apiDelete(`/packages/${packageId}/destinations/${destinationId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["package", packageId] });
    },
  });
}
