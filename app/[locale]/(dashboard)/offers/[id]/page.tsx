"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
  Package,
  Building2,
  MapPin,
  Hotel,
  Utensils,
  Plane,
  Calendar,
  CreditCard,
  Shield,
  Users,
  Edit,
  Trash2,
  Star,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useOffer, useDeleteOffer } from "@/hooks/use-offers";
import { useAuthStore } from "@/store/auth.store";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api";

export default function OfferDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("offers");
  const tc = useTranslations("common");
  const td = useTranslations("destinations");

  const offerId = params.id;
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "SYSTEM_ADMIN";

  const { data: offer, isLoading, error } = useOffer(offerId);
  const deleteOffer = useDeleteOffer();

  if (error) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.back()}>
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          {locale === "ar" ? "رجوع" : "Back"}
        </Button>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
          <p className="text-base font-medium text-destructive">{t("notFound")}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.back()}>
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          {locale === "ar" ? "رجوع" : "Back"}
        </Button>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
          <p className="text-base font-medium text-destructive">{t("notFound")}</p>
        </div>
      </div>
    );
  }

  const canEdit = isAdmin || offer.travelAgencyId === user?.travelAgencyId;

  async function handleDelete() {
    try {
      await deleteOffer.mutateAsync(offerId);
      toast.success(t("deleteSuccess"));
      router.push(`/${locale}/offers`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  const defaultRoomOption = offer.roomOptions?.find((r) => r.isDefault) || offer.roomOptions?.[0];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.back()}>
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          {locale === "ar" ? "رجوع" : "Back"}
        </Button>
        {canEdit && (
          <div className="flex gap-2">
            <Link href={`/${locale}/agencies/${offer.travelAgencyId}/offers/${offer.id}/edit`}>
              <Button size="sm" className="gap-1.5">
                <Edit className="h-4 w-4" />
                {tc("edit")}
              </Button>
            </Link>
            <ConfirmDialog
              title={t("deleteConfirm")}
              description={t("deleteWarning")}
              onConfirm={handleDelete}
              trigger={
                <Button variant="outline" size="sm" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
            />
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Title & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold">{offer.nameAr || offer.nameEn || offer.name}</h1>
              {offer.isFeatured && (
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              )}
            </div>
            {offer.descriptionAr || offer.descriptionEn || offer.description ? (
              <p className="text-sm text-muted-foreground max-w-2xl mt-2">
                {offer.descriptionAr || offer.descriptionEn || offer.description}
              </p>
            ) : null}
          </div>
          <StatusBadge status={offer.status} />
        </div>

        {/* Image */}
        {offer.imageUrl && (
          <div className="rounded-lg border overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={offer.imageUrl}
              alt={offer.nameEn || offer.nameAr}
              className="h-64 w-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Agency Info */}
      {offer.travelAgency && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {tc("agency")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">
                {offer.travelAgency.nameAr || offer.travelAgency.nameEn || offer.travelAgency.name}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Destinations */}
      {offer.destinations && offer.destinations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t("destinations")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {offer.destinations.map((dest, idx) => (
                <div key={dest.destinationId} className="flex items-start justify-between gap-3 pb-3 last:pb-0 border-b last:border-0">
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {idx + 1}. {dest.destination.nameAr || dest.destination.nameEn || dest.destination.name}
                    </div>
                    {(dest.destination.city || dest.destination.country) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {[dest.destination.city, dest.destination.country].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary">{dest.numberOfNights} {t("numberOfNights")}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hotels */}
      {offer.hotels && offer.hotels.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Hotel className="h-4 w-4" />
              {t("hotels")} ({offer.hotels.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {offer.hotels.map((hotel) => (
                <div key={hotel.hotelId} className="flex items-start gap-3 pb-3 last:pb-0 border-b last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {hotel.hotel.nameAr || hotel.hotel.nameEn || hotel.hotel.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {hotel.hotel.destination && (
                        <span className="text-xs text-muted-foreground">
                          {hotel.hotel.destination.nameAr || hotel.hotel.destination.nameEn || hotel.hotel.destination.name}
                        </span>
                      )}
                      {hotel.hotel.starRating && (
                        <span className="text-xs text-amber-500">
                          {"★".repeat(hotel.hotel.starRating)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Room Options */}
      {offer.roomOptions && offer.roomOptions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t("roomOptions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {offer.roomOptions && offer.roomOptions.length > 0 ? (() => {
              const hasRoomTypes = offer.roomOptions.some((r) => r.roomType);
              return (
                <div className="rounded-lg border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50 text-muted-foreground">
                        {hasRoomTypes && (
                          <th className="px-3 py-2 text-start font-medium">{t("roomType")}</th>
                        )}
                        <th className="px-3 py-2 text-start font-medium">{t("price")}</th>
                        <th className="px-3 py-2 text-center font-medium">{t("default")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {offer.roomOptions.map((opt, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          {hasRoomTypes && (
                            <td className="px-3 py-2">{opt.roomType || t("generalPrice")}</td>
                          )}
                          <td className="px-3 py-2">{formatCurrency(opt.price, offer.currency || "BHD", locale)}</td>
                          <td className="px-3 py-2 text-center">
                            {opt.isDefault && <Check className="h-4 w-4 mx-auto text-green-600" />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })() : null}
          </CardContent>
        </Card>
      )}

      {/* Meals */}
      {offer.meals && offer.meals.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Utensils className="h-4 w-4" />
              {t("meals")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {offer.meals.map((meal) => (
                <Badge key={meal.mealType} variant="outline">
                  {t(`meal_${meal.mealType}`)}
                  {meal.serviceType && ` - ${t(`service_${meal.serviceType}`)}`}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transports */}
      {offer.transports && offer.transports.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Plane className="h-4 w-4" />
              {t("transports")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {offer.transports.map((tr) => (
                <div key={tr.order} className="pb-3 last:pb-0 border-b last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>{t(`transport_${tr.transportType}`)}</Badge>
                    {tr.isDirectFlight && <Badge variant="secondary">{t("directFlight")}</Badge>}
                  </div>
                  <div className="grid gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t("fromLocation")}: </span>
                      <span className="font-medium">{tr.fromLocation}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t("toLocation")}: </span>
                      <span className="font-medium">{tr.toLocation}</span>
                    </div>
                    {tr.carType && (
                      <div>
                        <span className="text-muted-foreground">{t("carType")}: </span>
                        <span className="font-medium">{tr.carType}</span>
                      </div>
                    )}
                    {tr.notes && (
                      <div>
                        <span className="text-muted-foreground">{t("transportNotes")}: </span>
                        <span className="font-medium">{tr.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dates & Duration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {tc("dates")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {offer.checkInDate && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("checkInDate")}</p>
                <p className="font-medium text-sm">{formatDate(offer.checkInDate, locale)}</p>
              </div>
            )}
            {offer.checkOutDate && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("checkOutDate")}</p>
                <p className="font-medium text-sm">{formatDate(offer.checkOutDate, locale)}</p>
              </div>
            )}
            {offer.numberOfDays && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("numberOfDays")}</p>
                <p className="font-medium text-sm">{offer.numberOfDays} {locale === "ar" ? "أيام" : "days"}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Inclusions */}
      {(offer.includesVisa || offer.includesInsurance || offer.includesIslamicProgram) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t("inclusions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {offer.includesVisa && (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{t("includesVisa")}</span>
                </div>
              )}
              {offer.includesInsurance && (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{t("includesInsurance")}</span>
                </div>
              )}
              {offer.includesIslamicProgram && (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{t("includesIslamicProgram")}</span>
                </div>
              )}
              {offer.islamicAdvisor && (
                <div className="text-sm text-muted-foreground">
                  {t("islamicAdvisor")}: <span className="font-medium">{offer.islamicAdvisor}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Summary */}
      {defaultRoomOption && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {tc("pricing")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {defaultRoomOption.roomType ? `${t("roomType")}: ${defaultRoomOption.roomType}` : t("generalPrice")}
                </span>
                <span className="text-lg font-bold">
                  {formatCurrency(defaultRoomOption.price, offer.currency || "BHD", locale)}
                </span>
              </div>
              {offer.roomOptions && offer.roomOptions.length > 1 && (
                <p className="text-xs text-muted-foreground">{offer.roomOptions.length} {t("roomOptions")}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
