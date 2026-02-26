"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, Hotel, Eye, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { useHotels, useDeleteHotel } from "@/hooks/use-hotels";
import { useAuthStore } from "@/store/auth.store";
import { formatDate } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api";

export default function HotelsPage() {
  const t = useTranslations("hotels");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const user = useAuthStore((s) => s.user);

  // TRAVEL_AGENCY_ADMIN only sees own hotels (backend handles scope),
  // SYSTEM_ADMIN sees all
  const { data, isLoading } = useHotels({ page, limit: 20 });
  const deleteHotel = useDeleteHotel();
  const hotels = data?.data ?? [];
  const totalPages =
    data?.meta?.totalPages ??
    (data?.total ? Math.ceil(data.total / 20) : 1);

  async function handleDelete(id: string) {
    try {
      await deleteHotel.mutateAsync(id);
      toast.success(t("deleteSuccess"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
            {t("subtitle")}
          </p>
        </div>
        <Link href={`/${locale}/hotels/new`}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t("create")}
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-lg" />
          ))}
        </div>
      ) : hotels.length === 0 ? (
        <EmptyState
          icon={Hotel}
          title={t("noHotels")}
          description={t("noHotelsDesc")}
          action={
            <Link href={`/${locale}/hotels/new`}>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {t("create")}
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hotels.map((hotel) => (
              <Card
                key={hotel.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base truncate">
                        {hotel.nameAr || hotel.nameEn || hotel.name || "—"}
                      </CardTitle>
                      {hotel.nameEn && hotel.nameAr && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))] truncate mt-0.5">
                          {hotel.nameEn}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={hotel.status} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {hotel.starRating && (
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: hotel.starRating }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                  )}
                  {(hotel.city || hotel.country) && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1 truncate">
                      {[hotel.city, hotel.country].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {hotel.travelAgency && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1 truncate">
                      {hotel.travelAgency.nameAr ||
                        hotel.travelAgency.nameEn ||
                        hotel.travelAgency.name}
                    </p>
                  )}
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">
                    {formatDate(hotel.createdAt, locale)}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href={`/${locale}/hotels/${hotel.id}`}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {locale === "ar" ? "عرض" : "View"}
                      </Button>
                    </Link>
                    <Link href={`/${locale}/hotels/${hotel.id}/edit`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <ConfirmDialog
                      title={t("deleteConfirm")}
                      description={t("deleteWarning")}
                      onConfirm={() => handleDelete(hotel.id)}
                      trigger={
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
