import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import type { AdminUser, AuditLog, PaginatedResponse } from "@/types/api";

export function useAdminUsers(params?: {
  role?: string;
  isActive?: boolean;
  skip?: number;
  take?: number;
}) {
  return useQuery({
    queryKey: ["admin-users", params],
    queryFn: () =>
      apiGet<{ data: AdminUser[]; total: number; skip: number; take: number }>(
        "/admin/users",
        { skip: 0, take: 50, ...params }
      ),
  });
}

export function useCreateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      email: string;
      password?: string;
      role: string;
      travelAgencyId?: string;
    }) => apiPost<AdminUser>("/admin/users", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); },
  });
}

export function useUpdateUserRole(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { role: string; travelAgencyId?: string }) =>
      apiPatch<AdminUser>(`/admin/users/${userId}/role`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); },
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiPatch(`/admin/users/${userId}/deactivate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); },
  });
}

export function useActivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiPatch(`/admin/users/${userId}/activate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (userId: string) =>
      apiPost(`/admin/users/${userId}/reset-password`),
  });
}

export function useAuditLogs(params?: {
  userId?: string;
  action?: string;
  resourceType?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  minStatus?: number;
  maxStatus?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
  skip?: number;
  take?: number;
}) {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => {
      const query: Record<string, unknown> = {
        skip: params?.skip ?? 0,
        take: params?.take ?? 25,
      };
      if (params?.userId)       query.userId = params.userId;
      if (params?.action)       query.action = params.action;
      if (params?.resourceType) query.resourceType = params.resourceType;
      if (params?.method)       query.method = params.method;
      if (params?.path)         query.path = params.path;
      if (params?.statusCode != null) query.statusCode = params.statusCode;
      if (params?.minStatus != null)  query.minStatus = params.minStatus;
      if (params?.maxStatus != null)  query.maxStatus = params.maxStatus;
      if (params?.startDate)    query.startDate = params.startDate;
      if (params?.endDate)      query.endDate = params.endDate;
      if (params?.search)       query.search = params.search;
      return apiGet<PaginatedResponse<AuditLog>>("/admin/audit-logs", query);
    },
  });
}
