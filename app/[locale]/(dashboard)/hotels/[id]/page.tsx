"use client";

import { use } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Pencil, ArrowLeft, ArrowRight, Star, MapPin, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { useHotel } from "@/hooks/use-hotels";
import { formatDate } from "@/lib/utils";

export default function HotelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("hotels");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const { data: hotel, isLoading } = useHotel(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <EmptyState
        title={t("notFound")}
        action={
          <Link href={`/${locale}/hotels`}>
            <Button variant="outline">
              {locale === "ar" ? "رجوع للقائمة" : "Back to list"}
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/hotels`}>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <BackIcon className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                {hotel.nameAr || hotel.nameEn || hotel.name}
              </h1>
              <StatusBadge status={hotel.status} />
            </div>
            {hotel.nameEn && hotel.nameAr && (
              <p
                className="text-sm text-[hsl(var(--muted-foreground))]"
                dir="ltr"
              >
                {hotel.nameEn}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/${locale}/hotels/${id}/edit`}>
            <Button variant="outline" className="gap-2">
              <Pencil className="h-4 w-4" />
              {t("edit")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Hotel Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("hotelDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {hotel.starRating && (
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {t("starRating")}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {Array.from({ length: hotel.starRating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
                <span className="text-sm font-medium ms-1">
                  ({hotel.starRating})
                </span>
              </div>
            </div>
          )}

          {hotel.destination?.city && (
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {t("location")}
              </p>
              <p className="text-sm font-medium flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {hotel.destination.city}
              </p>
            </div>
          )}

          {hotel.address && (
            <div className="sm:col-span-2">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {t("address")}
              </p>
              <p className="text-sm font-medium" dir="ltr">
                {hotel.address}
              </p>
            </div>
          )}

          {hotel.googleMapUrl && (
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {t("googleMapUrl")}
              </p>
              <a
                href={hotel.googleMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[hsl(var(--primary))] hover:underline flex items-center gap-1"
              >
                <MapPin className="h-3.5 w-3.5" />
                {locale === "ar" ? "فتح في خرائط قوقل" : "Open in Google Maps"}
              </a>
            </div>
          )}

          {hotel.travelAgency && (
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {t("agency")}
              </p>
              <p className="text-sm font-medium flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {hotel.travelAgency.nameAr ||
                  hotel.travelAgency.nameEn ||
                  hotel.travelAgency.name}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {locale === "ar" ? "تاريخ الإنشاء" : "Created At"}
            </p>
            <p className="text-sm font-medium">
              {formatDate(hotel.createdAt, locale)}
            </p>
          </div>

          {hotel.amenities && (
            <div className="sm:col-span-2">
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">
                {t("amenities")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(() => {
                  try {
                    const list = JSON.parse(hotel.amenities);
                    if (Array.isArray(list)) {
                      return list.map((a: string, i: number) => (
                        <span
                          key={i}
                          className="inline-flex items-center rounded-full bg-[hsl(var(--accent))] px-2.5 py-0.5 text-xs font-medium"
                        >
                          {a}
                        </span>
                      ));
                    }
                  } catch {}
                  return (
                    <p className="text-sm" dir="ltr">
                      {hotel.amenities}
                    </p>
                  );
                })()}
              </div>
            </div>
          )}

          {hotel.descriptionAr && (
            <div className="sm:col-span-2">
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">
                {t("descriptionAr")}
              </p>
              <p className="text-sm" dir="rtl">
                {hotel.descriptionAr}
              </p>
            </div>
          )}
          {hotel.descriptionEn && (
            <div className="sm:col-span-2">
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">
                {t("descriptionEn")}
              </p>
              <p className="text-sm" dir="ltr">
                {hotel.descriptionEn}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
