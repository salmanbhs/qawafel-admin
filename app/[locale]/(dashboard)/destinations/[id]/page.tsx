"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ArrowRight, Edit, Trash2, MapPin } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { useDestination, useDeleteDestination } from "@/hooks/use-destinations";
import { useAuthStore } from "@/store/auth.store";
import { formatDate } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api";

export default function DestinationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("destinations");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "SYSTEM_ADMIN";

  const { data: destination, isLoading } = useDestination(id);
  const deleteDestination = useDeleteDestination();

  const handleDelete = async () => {
    try {
      await deleteDestination.mutateAsync(id);
      toast.success(t("deleted"));
      router.push(`/${locale}/destinations`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  if (!isAdmin) {
    return <EmptyState title={t("adminOnly")} description={t("adminOnlyDesc")} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!destination) {
    return (
      <EmptyState
        title={t("notFound")}
        action={
          <Button variant="outline" onClick={() => router.back()}>{tc("back")}</Button>
        }
      />
    );
  }

  const name = destination.nameAr || destination.nameEn || destination.name || tc("untitled");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{name}</h1>
              <StatusBadge status={destination.status} />
            </div>
            {destination.nameEn && destination.nameAr && (
              <p className="text-sm text-muted-foreground" dir="ltr">{destination.nameEn}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/${locale}/destinations/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="me-2 h-4 w-4" />{tc("edit")}
            </Button>
          </Link>
          <ConfirmDialog
            title={t("deleteDestination")}
            description={t("deleteDestinationConfirm")}
            onConfirm={handleDelete}
            isLoading={deleteDestination.isPending}
            trigger={
              <Button variant="destructive" size="sm">
                <Trash2 className="me-2 h-4 w-4" />{tc("delete")}
              </Button>
            }
          />
        </div>
      </div>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle>{t("destinationDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("status")}</span>
            <StatusBadge status={destination.status} />
          </div>
          {destination.region && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("region")}</span>
              <span>{destination.region}</span>
            </div>
          )}
          {destination.city && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("city")}</span>
              <span>{destination.city}</span>
            </div>
          )}
          {destination.latitude != null && destination.longitude != null && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                <MapPin className="inline h-3.5 w-3.5 me-1" />
                {t("latitude")} / {t("longitude")}
              </span>
              <span dir="ltr">{destination.latitude}, {destination.longitude}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{tc("createdAt")}</span>
            <span>{formatDate(destination.createdAt, locale)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
