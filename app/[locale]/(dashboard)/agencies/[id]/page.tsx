"use client";

import { use } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Pencil, Plus, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAgency } from "@/hooks/use-agencies";
import { useOffers, useDeleteOffer, useUpdateOffer } from "@/hooks/use-offers";
import { formatDate, formatCurrency } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api";

export default function AgencyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("agencies");
  const to = useTranslations("offers");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const { data: agency, isLoading } = useAgency(id);
  const { data: offersData, isLoading: offersLoading } = useOffers({ limit: 50 });
  const deleteOffer = useDeleteOffer();

  // Filter offers belonging to this agency from what the API returns
  const offers = (offersData?.data ?? []).filter((o) => o.travelAgencyId === id);

  async function handleDeleteOffer(offerId: string) {
    try {
      await deleteOffer.mutateAsync(offerId);
      toast.success(to("deleteSuccess"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!agency) {
    return (
      <EmptyState
        title={locale === "ar" ? "الوكالة غير موجودة" : "Agency not found"}
        action={
          <Link href={`/${locale}/agencies`}>
            <Button variant="outline">{locale === "ar" ? "رجوع للقائمة" : "Back to list"}</Button>
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
          <Link href={`/${locale}/agencies`}>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <BackIcon className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                {agency.nameAr || agency.nameEn || agency.name}
              </h1>
              <StatusBadge status={agency.status} />
            </div>
            {agency.nameEn && agency.nameAr && (
              <p className="text-sm text-[hsl(var(--muted-foreground))]" dir="ltr">
                {agency.nameEn}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/${locale}/agencies/${id}/edit`}>
            <Button variant="outline" className="gap-2">
              <Pencil className="h-4 w-4" />
              {t("edit")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Agency details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {locale === "ar" ? "تفاصيل الوكالة" : "Agency Details"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {agency.contactEmail && (
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{t("contactEmail")}</p>
              <p className="text-sm font-medium" dir="ltr">{agency.contactEmail}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{t("createdAt")}</p>
            <p className="text-sm font-medium">{formatDate(agency.createdAt, locale)}</p>
          </div>
          {agency.descriptionAr && (
            <div className="sm:col-span-2">
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">{t("descriptionAr")}</p>
              <p className="text-sm" dir="rtl">{agency.descriptionAr}</p>
            </div>
          )}
          {agency.descriptionEn && (
            <div className="sm:col-span-2">
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">{t("descriptionEn")}</p>
              <p className="text-sm" dir="ltr">{agency.descriptionEn}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Offers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{to("title")}</CardTitle>
          <Link href={`/${locale}/agencies/${id}/offers/new`}>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              {to("create")}
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {offersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : offers.length === 0 ? (
            <EmptyState
              title={locale === "ar" ? "لا توجد عروض" : "No offers yet"}
              description={locale === "ar" ? "أنشئ عرضاً لهذه الوكالة." : "Create an offer for this agency."}
              action={
                <Link href={`/${locale}/agencies/${id}/offers/new`}>
                  <Button size="sm" className="gap-1.5">
                    <Plus className="h-4 w-4" /> {to("create")}
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-[hsl(var(--border))]">
              {offers.map((offer) => (
                <div key={offer.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {offer.nameAr || offer.nameEn || offer.name || "—"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {offer.price != null && (
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          {formatCurrency(offer.price, offer.currency, locale)}
                        </span>
                      )}
                      {offer.checkInDate && (
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          {formatDate(offer.checkInDate, locale)}
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={offer.status} />
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/${locale}/agencies/${id}/offers/${offer.id}`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        {locale === "ar" ? "عرض" : "View"}
                      </Button>
                    </Link>
                    <ConfirmDialog
                      title={to("deleteConfirm")}
                      description={to("deleteWarning")}
                      onConfirm={() => handleDeleteOffer(offer.id)}
                      trigger={
                        <Button variant="outline" size="sm" className="text-[hsl(var(--destructive))]">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
