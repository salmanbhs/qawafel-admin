"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { ArrowRight, Pencil, Star, MapPin, Plus, Trash2, Search } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { usePackage, useAddPackageDestination, useRemovePackageDestination } from "@/hooks/use-packages";
import { useDestinations } from "@/hooks/use-destinations";
import { useAuthStore } from "@/store/auth.store";
import { formatDate } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api";

export default function PackageDetailPage() {
  const t = useTranslations("packages");
  const td = useTranslations("destinations");
  const router = useRouter();
  const params = useParams<{ locale: string; id: string }>();
  const locale = params.locale;
  const id = params.id;

  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "SYSTEM_ADMIN";

  const [destSearch, setDestSearch] = useState("");

  const { data: pkg, isLoading } = usePackage(id);
  const { data: allDestsData } = useDestinations({ limit: 100 });
  const allDestinations = allDestsData?.data ?? [];

  const addDestination = useAddPackageDestination(id);
  const removeDestination = useRemovePackageDestination(id);

  const linkedDestIds = new Set((pkg?.destinations ?? []).map((d) => d.destinationId));
  const unlinkedDestinations = allDestinations.filter(
    (d) =>
      !linkedDestIds.has(d.id) &&
      (!destSearch.trim() ||
        (d.nameAr ?? "").includes(destSearch) ||
        (d.nameEn ?? "").toLowerCase().includes(destSearch.toLowerCase()) ||
        (d.city ?? "").toLowerCase().includes(destSearch.toLowerCase()))
  );

  async function handleAddDestination(destinationId: string) {
    try {
      await addDestination.mutateAsync(destinationId);
      toast.success(t("destinationLinked"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  async function handleRemoveDestination(destinationId: string) {
    try {
      await removeDestination.mutateAsync(destinationId);
      toast.success(t("destinationUnlinked"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  if (!isAdmin) {
    return <EmptyState title={t("adminOnly")} description={t("adminOnlyDesc")} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!pkg) {
    return <EmptyState title={t("notFound")} description={t("notFoundDesc")} />;
  }

  const linkedDestinations = pkg.destinations ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
          <div className="flex items-center gap-3">
            {pkg.iconImageUrl && (
              <img
                src={pkg.iconImageUrl}
                alt={pkg.name || pkg.nameEn || ""}
                className="w-12 h-12 rounded-lg object-contain border bg-muted p-1"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">
                {pkg.nameAr || pkg.nameEn || pkg.name || "—"}
              </h1>
              {pkg.nameEn && pkg.nameAr && (
                <p className="text-sm text-muted-foreground">{pkg.nameEn}</p>
              )}
            </div>
          </div>
        </div>
        <Link href={`/${locale}/packages/${id}/edit`}>
          <Button variant="outline" className="gap-2">
            <Pencil className="h-4 w-4" />
            {t("edit")}
          </Button>
        </Link>
      </div>

      {/* Package Details */}
      <Card>
        <CardHeader>
          <CardTitle>{t("packageDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">{t("status")}</p>
              <StatusBadge status={pkg.status} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("isFeatured")}</p>
              <p className="font-medium flex items-center gap-1">
                {pkg.isFeatured ? (
                  <>
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span>{t("yes")}</span>
                  </>
                ) : (
                  t("no")
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("createdAt")}</p>
              <p className="font-medium">{formatDate(pkg.createdAt)}</p>
            </div>
          </div>

          {pkg.bannerImageUrl && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">{t("packageBanner")}</p>
              <img
                src={pkg.bannerImageUrl}
                alt={`${pkg.name} banner`}
                className="w-full h-48 rounded-lg object-cover border"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Linked Destinations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            {td("title")}
            {linkedDestinations.length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {linkedDestinations.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {linkedDestinations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">{t("noLinkedDestinations")}</p>
          ) : (
            <div className="divide-y">
              {linkedDestinations.map(({ destinationId, destination }) => (
                <div key={destinationId} className="flex items-center justify-between py-2.5 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">
                      {destination.nameAr || destination.nameEn || destination.name || "—"}
                    </p>
                    {(destination.city || destination.region) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {[destination.city, destination.region].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={destination.status} />
                    <ConfirmDialog
                      title={t("unlinkDestinationTitle")}
                      description={t("unlinkDestinationDesc")}
                      onConfirm={() => handleRemoveDestination(destinationId)}
                      isLoading={removeDestination.isPending}
                      trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
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

      {/* Add Destination */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-muted-foreground" />
            {t("addDestination")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-9"
              placeholder={t("searchDestinations")}
              value={destSearch}
              onChange={(e) => setDestSearch(e.target.value)}
            />
          </div>
          {unlinkedDestinations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              {destSearch ? t("noSearchResults") : t("allLinked")}
            </p>
          ) : (
            <div className="divide-y max-h-72 overflow-y-auto rounded-md border">
              {unlinkedDestinations.map((dest) => (
                <div key={dest.id} className="flex items-center justify-between px-3 py-2.5 gap-3 hover:bg-muted/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {dest.nameAr || dest.nameEn || dest.name || "—"}
                    </p>
                    {(dest.city || dest.region) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {[dest.city, dest.region].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 flex-shrink-0"
                    disabled={addDestination.isPending}
                    onClick={() => handleAddDestination(dest.id)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t("link")}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
