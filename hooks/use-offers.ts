import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete, apiPostForm } from "@/lib/api";
import type { Offer, PaginatedResponse, OfferImage, ImageUploadResponse, PreUploadResponse, CreateOfferPayload, UpdateOfferPayload } from "@/types/api";

export function useOffers(params?: {
  page?: number;
  limit?: number;
  travelAgencyId?: string;
  destinationId?: string;
  packageId?: string;
  status?: string;
  featured?: boolean;
}) {
  return useQuery({
    queryKey: ["offers", params],
    queryFn: () =>
      apiGet<PaginatedResponse<Offer>>("/offers", {
        page: params?.page || 1,
        limit: params?.limit || 20,
        ...(params?.travelAgencyId && { travelAgencyId: params.travelAgencyId }),
        ...(params?.destinationId && { destinationId: params.destinationId }),
        ...(params?.packageId && { packageId: params.packageId }),
        ...(params?.status && { status: params.status }),
        ...(params?.featured === true && { featured: "true" }),
      }),
  });
}

export function useOffer(id: string) {
  return useQuery({
    queryKey: ["offer", id],
    queryFn: () => apiGet<Offer>(`/offers/${id}`, {}, { "X-Raw-Response": "true" }),
    enabled: !!id,
    retry: (count, error: unknown) => {
      // Don't retry on 404
      const err = error as { response?: { status: number } };
      if (err?.response?.status === 404) return false;
      return count < 1;
    },
  });
}

export function useCreateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOfferPayload) => apiPost<Offer>("/offers", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["offers"] }); },
  });
}

export function useUpdateOffer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateOfferPayload) => apiPatch<Offer>(`/offers/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["offers"] });
      qc.invalidateQueries({ queryKey: ["offer", id] });
    },
  });
}

export function useDeleteOffer(agencyId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/offers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["offers"] });
      if (agencyId) qc.invalidateQueries({ queryKey: ["agency", agencyId] });
    },
  });
}

export function useOfferImages(offerId: string) {
  return useQuery({
    queryKey: ["offer-images", offerId],
    queryFn: () =>
      apiGet<{ data: OfferImage[]; meta: { total: number } }>(`/offers/${offerId}/images`),
    enabled: !!offerId,
  });
}

export function useUploadOfferImage(offerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      apiPostForm<ImageUploadResponse>(`/offers/${offerId}/upload-image`, formData),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["offer-images", offerId] }); },
  });
}

export function usePreUploadImage() {
  return useMutation({
    mutationFn: (formData: FormData) =>
      apiPostForm<PreUploadResponse>("/offers/pre-upload", formData),
  });
}

export function useConfirmExtraction(offerId: string, imageId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { confirmedFields: string[] }) =>
      apiPost<{ offerId: string; updatedFields: string[] }>(
        `/offers/${offerId}/confirm-extraction`,
        { imageId, confirmedFields: body.confirmedFields }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["offer", offerId] });
      qc.invalidateQueries({ queryKey: ["offer-images", offerId] });
    },
  });
}

export function useDeleteOfferImage(offerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) => apiDelete(`/offers/${offerId}/images/${imageId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["offer-images", offerId] }); },
  });
}
