"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, MapPin, Eye } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { useDestinations, useDeleteDestination } from "@/hooks/use-destinations";
import { useAuthStore } from "@/store/auth.store";
import { formatDate } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api";

export default function DestinationsPage() {
  const t = useTranslations("destinations");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "SYSTEM_ADMIN";

  const { data, isLoading } = useDestinations({ page, limit: 20 });
  const deleteDestination = useDeleteDestination();
  const destinations = data?.data ?? [];
  const totalPages =
    data?.meta?.totalPages ??
    (data?.total ? Math.ceil(data.total / 20) : 1);

  async function handleDelete(id: string) {
    try {
      await deleteDestination.mutateAsync(id);
      toast.success(t("deleted"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  // Only SYSTEM_ADMIN can manage destinations
  if (!isAdmin) {
    return (
      <EmptyState
        icon={MapPin}
        title={t("adminOnly")}
        description={t("adminOnlyDesc")}
      />
    );
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
        <Link href={`/${locale}/destinations/new`}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t("create")}
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      ) : destinations.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title={t("noDestinations")}
          description={t("noDestinationsDesc")}
          action={
            <Link href={`/${locale}/destinations/new`}>
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
            {destinations.map((dest) => (
              <Card key={dest.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base truncate">
                        {dest.nameAr || dest.nameEn || dest.name || "—"}
                      </CardTitle>
                      {dest.nameEn && dest.nameAr && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))] truncate mt-0.5">
                          {dest.nameEn}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={dest.status} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {(dest.city || dest.country) && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2 truncate">
                      <MapPin className="inline h-3 w-3 me-1" />
                      {[dest.city, dest.region, dest.country].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {formatDate(dest.createdAt, locale)}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Link href={`/${locale}/destinations/${dest.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-1.5">
                        <Eye className="h-3.5 w-3.5" />
                        {tc("view")}
                      </Button>
                    </Link>
                    <Link href={`/${locale}/destinations/${dest.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <ConfirmDialog
                      title={t("deleteDestination")}
                      description={t("deleteDestinationConfirm")}
                      onConfirm={() => handleDelete(dest.id)}
                      isLoading={deleteDestination.isPending}
                      trigger={
                        <Button variant="outline" size="sm" className="text-[hsl(var(--destructive))]">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
