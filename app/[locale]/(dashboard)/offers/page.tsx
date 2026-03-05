"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  Package,
  Building2,
  Star,
  SlidersHorizontal,
  X,
  Plus,
  Eye,
  Trash2,
  MapPin,
  Calendar,
  Plane,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { ArchiveStatus } from "@/components/offers/ArchiveStatus";
import { ArchivedOffersDialog } from "@/components/offers/ArchivedOffersDialog";
import { AdminArchiveTools } from "@/components/offers/AdminArchiveTools";
import { 
  useOffers, 
  useDeleteOffer, 
  useArchiveOffer, 
  useUnarchiveOffer 
} from "@/hooks/use-offers";
import { useAgencies } from "@/hooks/use-agencies";
import { useDestinations } from "@/hooks/use-destinations";
import { usePackages } from "@/hooks/use-packages";
import { useAuthStore } from "@/store/auth.store";
import { formatDate, formatCurrency } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api";
import type { OfferStatus } from "@/types/api";

const OFFER_STATUSES: OfferStatus[] = [
  "PENDING",
  "ACTIVE",
  "ARCHIVED",
];

const STATUS_KEY: Record<OfferStatus, string> = {
  PENDING: "status_PENDING",
  ACTIVE: "status_ACTIVE",
  ARCHIVED: "status_ARCHIVED",
};

export default function OffersPage() {
  const t = useTranslations("offers");
  const tc = useTranslations("common");
  const locale = useLocale();

  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "SYSTEM_ADMIN";
  const isAgencyRole =
    user?.role === "TRAVEL_AGENCY_ADMIN" ||
    user?.role === "TRAVEL_AGENCY_STAFF";
  const myAgencyId = user?.travelAgencyId ?? undefined;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("__all");
  const [agencyFilter, setAgencyFilter] = useState<string>(
    isAgencyRole && myAgencyId ? myAgencyId : "__all"
  );
  const [destFilter, setDestFilter] = useState<string>("__all");
  const [packageFilter, setPackageFilter] = useState<string>("__all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [archivedDialogOpen, setArchivedDialogOpen] = useState(false);
  const [selectedOfferForArchive, setSelectedOfferForArchive] = useState<string | null>(null);

  const hasFilters =
    statusFilter !== "__all" ||
    (isAdmin && agencyFilter !== "__all") ||
    destFilter !== "__all" ||
    packageFilter !== "__all" ||
    featuredOnly ||
    search.trim() !== "";

  // Automatically exclude archived offers from main view unless explicitly filtered
  const params = {
    page,
    limit: 20,
    ...(statusFilter !== "__all" && { status: statusFilter }),
    ...(agencyFilter !== "__all" && { travelAgencyId: agencyFilter }),
    ...(destFilter !== "__all" && { destinationId: destFilter }),
    ...(packageFilter !== "__all" && { packageId: packageFilter }),
    ...(featuredOnly && { featured: true }),
  };

  const { data, isLoading } = useOffers(params);

  const totalPages = data?.meta?.totalPages ?? 1;
  const allOffers = data?.data ?? [];

  const offers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allOffers;
    return allOffers.filter(
      (o) =>
        (o.nameAr ?? "").toLowerCase().includes(q) ||
        (o.nameEn ?? "").toLowerCase().includes(q) ||
        (o.name ?? "").toLowerCase().includes(q)
    );
  }, [allOffers, search]);

  const { data: agenciesData } = useAgencies({ limit: 100 });
  const agencies = agenciesData?.data ?? [];
  const { data: destsData } = useDestinations({ limit: 100 });
  const destinations = destsData?.data ?? [];
  const { data: packagesData } = usePackages({ limit: 100 });
  const packagesList = packagesData?.data ?? [];

  const deleteOffer = useDeleteOffer();
  const archiveOffer = useArchiveOffer();
  const unarchiveOffer = useUnarchiveOffer();

  async function handleDelete(id: string) {
    try {
      await deleteOffer.mutateAsync(id);
      toast.success(t("deleteSuccess"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  async function handleArchive(id: string) {
    try {
      await archiveOffer.mutateAsync(id);
      toast.success(t("offerArchived"));
      setSelectedOfferForArchive(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  async function handleUnarchive(id: string) {
    try {
      await unarchiveOffer.mutateAsync(id);
      toast.success(t("offerRestored"));
      setSelectedOfferForArchive(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  function clearFilters() {
    setStatusFilter("__all");
    setAgencyFilter(isAgencyRole && myAgencyId ? myAgencyId : "__all");
    setDestFilter("__all");
    setPackageFilter("__all");
    setFeaturedOnly(false);
    setSearch("");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Admin Archive Tools */}
      {isAdmin && (
        <AdminArchiveTools 
          onArchivedClick={() => setArchivedDialogOpen(true)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            {t("subtitle")}
          </p>
        </div>
        {isAgencyRole && myAgencyId && (
          <Link href={`/${locale}/agencies/${myAgencyId}/offers/new`}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t("create")}
            </Button>
          </Link>
        )}
        {isAdmin && (
          <Link href={`/${locale}/offers/new`}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t("create")}
            </Button>
          </Link>
        )}
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))]">
              <SlidersHorizontal className="h-4 w-4" />
              {tc("filter")}
            </div>

            <Input
              placeholder={`${tc("search")}...`}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-8 w-44 text-sm"
              dir="auto"
            />

            <Select
              value={statusFilter}
              onValueChange={(v) => { setStatusFilter(v); setPage(1); }}
            >
              <SelectTrigger className="h-8 w-40 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">{t("allStatuses")}</SelectItem>
                {OFFER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(STATUS_KEY[s] as any)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isAdmin && (
              <Select
                value={agencyFilter}
                onValueChange={(v) => { setAgencyFilter(v); setPage(1); }}
              >
                <SelectTrigger className="h-8 w-48 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">{t("allAgencies")}</SelectItem>
                  {agencies.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nameAr || a.nameEn || a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select
              value={destFilter}
              onValueChange={(v) => { setDestFilter(v); setPage(1); }}
            >
              <SelectTrigger className="h-8 w-48 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">{t("allDestinations")}</SelectItem>
                {destinations.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nameAr || d.nameEn || d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={packageFilter}
              onValueChange={(v) => { setPackageFilter(v); setPage(1); }}
            >
              <SelectTrigger className="h-8 w-48 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">{t("allPackages")}</SelectItem>
                {packagesList.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nameAr || c.nameEn || c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <button
              type="button"
              onClick={() => { setFeaturedOnly((v) => !v); setPage(1); }}
              className={`flex items-center gap-1.5 rounded-md border px-3 h-8 text-sm font-medium transition-colors ${
                featuredOnly
                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                  : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))]"
              }`}
            >
              <Star className="h-3.5 w-3.5" />
              {t("featuredOnly")}
            </button>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                {t("clearFilters")}
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            {isLoading
              ? tc("loading")
              : locale === "ar"
              ? `${data?.meta?.total ?? offers.length} عرض`
              : `${data?.meta?.total ?? offers.length} offer${(data?.meta?.total ?? offers.length) !== 1 ? "s" : ""}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-72 rounded-xl" />
              ))}
            </div>
          ) : offers.length === 0 ? (
            <EmptyState
              title={tc("noResults")}
              description={
                hasFilters
                  ? locale === "ar"
                    ? "جرّب تعديل عوامل التصفية"
                    : "Try adjusting your filters"
                  : t("noOffersDesc")
              }
              action={
                hasFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
                    {t("clearFilters")}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {offers.map((offer) => {
                const defaultPrice =
                  offer.roomOptions?.find((r) => r.isDefault)?.price ??
                  offer.roomOptions?.[0]?.price;
                const hasFlight = offer.transports?.some(
                  (tr) => tr.transportType === "FLY"
                );
                const totalNights = offer.destinations
                  ? offer.destinations.reduce((sum, d) => sum + (d.numberOfNights ?? 0), 0)
                  : null;

                return (
                  <Card
                    key={offer.id}
                    className="flex flex-col overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Banner image */}
                    <div className="relative h-36 bg-muted flex-shrink-0">
                      {offer.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={offer.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute top-2 end-2 flex items-center gap-1.5">
                        {offer.isFeatured && (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        )}
                        <StatusBadge status={offer.status} />
                      </div>
                    </div>

                    <div className="flex flex-col flex-1 p-4 gap-3">
                      {/* Name */}
                      <div>
                        <h3 className="font-semibold text-base leading-snug line-clamp-2">
                          {offer.nameAr || offer.nameEn || offer.name || "—"}
                        </h3>
                        {offer.nameEn && offer.nameAr && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate dir-ltr">
                            {offer.nameEn}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        {/* Agency */}
                        {offer.travelAgency && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="truncate text-muted-foreground">
                              {offer.travelAgency.nameAr ||
                                offer.travelAgency.nameEn ||
                                offer.travelAgency.name}
                            </span>
                          </div>
                        )}

                        {/* Destinations */}
                        {offer.destinations && offer.destinations.length > 0 && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <span className="leading-snug">
                              {offer.destinations
                                .map(
                                  (d) =>
                                    d.destination.nameAr ||
                                    d.destination.nameEn ||
                                    d.destination.name
                                )
                                .join(" · ")}
                            </span>
                          </div>
                        )}

                        {/* Dates + nights */}
                        {(offer.checkInDate || offer.numberOfDays) && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">
                              {offer.checkInDate &&
                                formatDate(offer.checkInDate, locale)}
                              {offer.checkOutDate &&
                                ` → ${formatDate(offer.checkOutDate, locale)}`}
                              {(totalNights ?? offer.numberOfDays) ? (
                                <span className="ms-1.5 text-xs font-medium text-foreground">
                                  ({totalNights ?? offer.numberOfDays}{" "}
                                  {locale === "ar" ? "ليلة" : "nights"})
                                </span>
                              ) : null}
                            </span>
                          </div>
                        )}

                        {/* Price */}
                        {defaultPrice != null && (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-bold">
                              {formatCurrency(
                                defaultPrice,
                                offer.currency || "BHD",
                                locale
                              )}
                            </span>
                            {offer.roomOptions && offer.roomOptions.length > 1 && (
                              <span className="text-xs text-muted-foreground">
                                {locale === "ar"
                                  ? `+ ${offer.roomOptions.length - 1} خيارات`
                                  : `+ ${offer.roomOptions.length - 1} option${offer.roomOptions.length - 1 !== 1 ? "s" : ""}`}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Flight badge */}
                      {hasFlight && (
                        <div className="flex items-center gap-2 rounded-md bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-3 py-1.5">
                          <Plane className="h-4 w-4 shrink-0" />
                          <span className="text-sm font-medium">
                            {locale === "ar" ? "يشمل رحلة طيران" : "Includes flight"}
                          </span>
                        </div>
                      )}

                      {/* Inclusions chips */}
                      {(offer.includesVisa ||
                        offer.includesInsurance ||
                        offer.includesIslamicProgram) && (
                        <div className="flex flex-wrap gap-1.5">
                          {offer.includesVisa && (
                            <Badge variant="secondary" className="text-xs">
                              {locale === "ar" ? "تأشيرة" : "Visa"}
                            </Badge>
                          )}
                          {offer.includesInsurance && (
                            <Badge variant="secondary" className="text-xs">
                              {locale === "ar" ? "تأمين" : "Insurance"}
                            </Badge>
                          )}
                          {offer.includesIslamicProgram && (
                            <Badge variant="secondary" className="text-xs">
                              {locale === "ar" ? "برنامج ديني" : "Islamic Program"}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* Actions */}
                      <div className="flex flex-col gap-2 pt-3 border-t mt-1">
                        <div className="flex gap-2">
                          <Link href={`/${locale}/offers/${offer.id}`} className="flex-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full gap-1.5"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              {locale === "ar" ? "عرض" : "View"}
                            </Button>
                          </Link>
                          {(isAdmin || offer.travelAgencyId === myAgencyId) && (
                            <>
                              {offer.status !== "ARCHIVED" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleArchive(offer.id)}
                                  disabled={archiveOffer.isPending}
                                  title={t("archiveOffer")}
                                >
                                  <Archive className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <ConfirmDialog
                                title={t("deleteConfirm")}
                                description={t("deleteWarning")}
                                onConfirm={() => handleDelete(offer.id)}
                                trigger={
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                }
                              />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archived Offers Dialog */}
      <ArchivedOffersDialog 
        isOpen={archivedDialogOpen}
        onOpenChange={setArchivedDialogOpen}
      />
    </div>
  );
}
