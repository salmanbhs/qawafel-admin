import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import type {
  InstagramMonitoredAccount,
  InstagramImport,
  InstagramPaginatedResponse,
  CreateMonitoredAccountPayload,
  UpdateMonitoredAccountPayload,
  UpdateInstagramImportPayload,
  InstagramImportStatus,
} from "@/types/api";

// ────────── Monitored Accounts ──────────────────────────────────────────────

export function useMonitoredAccounts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  travelAgencyId?: string;
  isEnabled?: boolean;
}) {
  return useQuery({
    queryKey: ["monitored-accounts", params],
    queryFn: () =>
      apiGet<InstagramPaginatedResponse<InstagramMonitoredAccount>>("/instagram-import/accounts", {
        page: params?.page || 1,
        limit: params?.limit || 20,
        ...(params?.search && { search: params.search }),
        ...(params?.travelAgencyId && { travelAgencyId: params.travelAgencyId }),
        ...(params?.isEnabled !== undefined && { isEnabled: String(params.isEnabled) }),
      }),
    placeholderData: keepPreviousData,
  });
}

export function useMonitoredAccount(id: string) {
  return useQuery({
    queryKey: ["monitored-account", id],
    queryFn: () => apiGet<InstagramMonitoredAccount>(`/instagram-import/accounts/${id}`),
    enabled: !!id,
  });
}

export function useCreateMonitoredAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMonitoredAccountPayload) =>
      apiPost<InstagramMonitoredAccount>("/instagram-import/accounts", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["monitored-accounts"] });
    },
  });
}

export function useUpdateMonitoredAccount(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateMonitoredAccountPayload) =>
      apiPatch<InstagramMonitoredAccount>(`/instagram-import/accounts/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["monitored-accounts"] });
      qc.invalidateQueries({ queryKey: ["monitored-account", id] });
    },
  });
}

export function useDeleteMonitoredAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/instagram-import/accounts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["monitored-accounts"] });
    },
  });
}

// ────────── Instagram Imports ───────────────────────────────────────────────

export function useInstagramImports(params?: {
  page?: number;
  limit?: number;
  status?: InstagramImportStatus | InstagramImportStatus[];
  travelAgencyId?: string;
  instagramMonitoredAccountId?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["instagram-imports", params],
    queryFn: () =>
      apiGet<InstagramPaginatedResponse<InstagramImport>>("/instagram-import", {
        page: params?.page || 1,
        limit: params?.limit || 20,
        ...(params?.status && { status: params.status }),
        ...(params?.travelAgencyId && { travelAgencyId: params.travelAgencyId }),
        ...(params?.instagramMonitoredAccountId && {
          instagramMonitoredAccountId: params.instagramMonitoredAccountId,
        }),
        ...(params?.search && { search: params.search }),
      }),
    placeholderData: keepPreviousData,
  });
}

export function useInstagramImport(id: string) {
  return useQuery({
    queryKey: ["instagram-import", id],
    queryFn: () => apiGet<InstagramImport>(`/instagram-import/${id}`),
    enabled: !!id,
  });
}

export function useUpdateInstagramImport(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateInstagramImportPayload) =>
      apiPatch<InstagramImport>(`/instagram-import/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instagram-imports"] });
      qc.invalidateQueries({ queryKey: ["instagram-import", id] });
    },
  });
}

export function useDismissImport(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiPatch<InstagramImport>(`/instagram-import/${id}/dismiss`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instagram-imports"] });
      qc.invalidateQueries({ queryKey: ["instagram-import", id] });
    },
  });
}
