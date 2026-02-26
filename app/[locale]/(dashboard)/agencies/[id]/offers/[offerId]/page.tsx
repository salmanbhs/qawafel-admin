"use client";

import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, Edit, Trash2, ImageIcon, MapPin,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { ImageUpload } from "@/components/offers/ImageUpload";
import { ImageGallery } from "@/components/offers/ImageGallery";
import { useOffer, useDeleteOffer, useOfferImages } from "@/hooks/use-offers";
import { useAuthStore } from "@/store/auth.store";
import { getApiErrorMessage } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function OfferDetailPage() {
  const t = useTranslations("offers");
  const td = useTranslations("destinations");
  const tc = useTranslations("common");
  const params = useParams<{ locale: string; id: string; offerId: string }>();
  const { locale, id: agencyId, offerId } = params;
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { data: offer, isLoading } = useOffer(offerId);
  const { data: imagesData, isLoading: imagesLoading } = useOfferImages(offerId);
  const deleteOffer = useDeleteOffer(agencyId);

  const handleDelete = async () => {
    try {
      await deleteOffer.mutateAsync(offerId);
      toast.success(t("deleted"));
      router.push(`/${locale}/agencies/${agencyId}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!offer) {
    return (
      <EmptyState
        title={t("notFound")}
        action={
          <Button variant="outline" onClick={() => router.back()}>{tc("back")}</Button>
        }
      />
    );
  }

  const images = imagesData?.data || [];
  const destinations = (offer.destinations || []).map((d) => d.destination);
  const hotels = (offer.hotels || []).map((h) => h.hotel);
  const name = offer.nameAr || offer.nameEn || tc("untitled");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{name}</h1>
            <p className="text-sm text-muted-foreground">{offer.nameEn}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/${locale}/agencies/${agencyId}/offers/${offerId}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="me-2 h-4 w-4" />{tc("edit")}
            </Button>
          </Link>
          <ConfirmDialog
            title={t("deleteOffer")}
            description={t("deleteOfferConfirm")}
            onConfirm={handleDelete}
            isLoading={deleteOffer.isPending}
            trigger={
              <Button variant="destructive" size="sm">
                <Trash2 className="me-2 h-4 w-4" />{tc("delete")}
              </Button>
            }
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("offerDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("status")}</span>
                <StatusBadge status={offer.status} />
              </div>
              {offer.price != null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("price")}</span>
                  <span className="font-semibold">{formatCurrency(offer.price, offer.currency || "BHD", locale)}</span>
                </div>
              )}
              {hotels.length > 0 && (
                <div className="flex items-start justify-between">
                  <span className="text-sm text-muted-foreground">{t("hotel")}</span>
                  <div className="text-end space-y-1">
                    {hotels.map((h) => (
                      <div key={h.id} className="text-sm">
                        {h.nameAr || h.nameEn || h.name}
                        {h.starRating ? ` ${'★'.repeat(h.starRating)}` : ""}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {offer.bedCount != null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("bedCount")}</span>
                  <span>{offer.bedCount}</span>
                </div>
              )}
              {offer.maxGuests != null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("maxGuests")}</span>
                  <span>{offer.maxGuests}</span>
                </div>
              )}
              {offer.checkInDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("checkInDate")}</span>
                  <span>{formatDate(offer.checkInDate, locale)}</span>
                </div>
              )}
              {offer.checkOutDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("checkOutDate")}</span>
                  <span>{formatDate(offer.checkOutDate, locale)}</span>
                </div>
              )}
              {offer.imageUrl && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-2">{t("offerImage")}</span>
                  <img src={offer.imageUrl} alt={name} className="rounded-lg border h-40 w-full object-cover" />
                </div>
              )}
              {offer.descriptionAr && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">{t("descriptionAr")}</span>
                  <p className="text-sm" dir="rtl">{offer.descriptionAr}</p>
                </div>
              )}
              {offer.descriptionEn && (
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">{t("descriptionEn")}</span>
                  <p className="text-sm" dir="ltr">{offer.descriptionEn}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Destinations (from offer response) */}
          {destinations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{td("destinations")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {destinations.map((dest) => (
                    <Link
                      key={dest.id}
                      href={`/${locale}/destinations/${dest.id}`}
                      className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{dest.nameAr || dest.nameEn}</p>
                        <p className="text-xs text-muted-foreground">
                          {[dest.country, dest.city].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Images panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{t("images")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUpload offerId={offerId} />
              {imagesLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <ImageGallery offerId={offerId} images={images} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
