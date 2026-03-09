"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Instagram, Eye, CheckCircle, XCircle, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  useInstagramImports,
  useDismissImport,
} from "@/hooks/use-instagram-import";
import { useReferenceAgencies } from "@/hooks/use-reference-data";
import { getApiErrorMessage } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { InstagramImportStatus, InstagramImport } from "@/types/api";

/** Prisma Decimal comes as {s,e,d[]} — normalise to plain number. */
function toNumber(v: number | { s: number; e: number; d: number[] } | null | undefined): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (typeof v === "object" && Array.isArray(v.d)) return v.s * v.d[0];
  return null;
}

export default function InstagramImportsPage() {
  const t = useTranslations("instagram");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [agencyFilter, setAgencyFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  const { agencies } = useReferenceAgencies();

  const { data, isLoading } = useInstagramImports({
    page,
    limit: 20,
    ...(statusFilter !== "ALL" && { status: statusFilter as InstagramImportStatus }),
    ...(agencyFilter !== "ALL" && { travelAgencyId: agencyFilter }),
    ...(searchDebounced && { search: searchDebounced }),
  });

  const imports = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  // Debounce search
  const handleSearch = (value: string) => {
    setSearch(value);
    const timeout = setTimeout(() => {
      setSearchDebounced(value);
      setPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
            <SelectItem value="NEW">{t("statusNew")}</SelectItem>
            <SelectItem value="OFFER_CREATED">{t("statusOfferCreated")}</SelectItem>
            <SelectItem value="DISMISSED">{t("statusDismissed")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={agencyFilter} onValueChange={(v) => { setAgencyFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder={t("allAgencies")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("allAgencies")}</SelectItem>
            {agencies.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.nameAr || a.nameEn || a.name || "—"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[9/16] rounded-lg" />
          ))}
        </div>
      ) : imports.length === 0 ? (
        <EmptyState
          icon={Instagram}
          title={t("noImports")}
          description={t("noImportsDesc")}
        />
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
            {imports.map((item) => (
              <ImportCard key={item.id} item={item} locale={locale} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

function ImportCard({ item, locale }: { item: InstagramImport; locale: string }) {
  const t = useTranslations("instagram");
  const tc = useTranslations("common");
  const price = toNumber(item.extractedPrice);
  const dismissImport = useDismissImport(item.id);
  const isNew = item.status === "NEW";

  async function handleDismiss() {
    try {
      await dismissImport.mutateAsync();
      toast.success(t("dismissed"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      {/* Image preview */}
      {item.imageUrl ? (
        <div className="relative aspect-[9/16] bg-[hsl(var(--muted))]">
          <img
            src={item.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute top-2 end-2">
            <StatusBadge status={item.status} />
          </div>
        </div>
      ) : (
        <div className="relative aspect-[9/16] bg-[hsl(var(--muted))] flex items-center justify-center">
          <Instagram className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />
          <div className="absolute top-2 end-2">
            <StatusBadge status={item.status} />
          </div>
        </div>
      )}
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
          <Instagram className="h-3.5 w-3.5" />
          <span>@{item.monitoredAccount?.instagramUsername}</span>
        </div>
        {(item.extractedDestination || item.extractedHotelName) && (
          <p className="text-sm font-medium truncate">
            {item.extractedDestination}
            {item.extractedDestination && item.extractedHotelName && " — "}
            {item.extractedHotelName}
          </p>
        )}
        {price != null && (
          <p className="text-sm font-semibold text-[hsl(var(--primary))]">
            {formatCurrency(price, item.extractedCurrency || "BHD", locale)}
          </p>
        )}
        {item.travelAgency && (
          <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
            {item.travelAgency.name || item.travelAgency.nameAr || item.travelAgency.nameEn}
          </p>
        )}
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          {formatDate(item.createdAt, locale)}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href={`/${locale}/instagram/${item.id}`} className="flex-1 min-w-0">
            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
              <Eye className="h-3.5 w-3.5" />
              {tc("view")}
            </Button>
          </Link>
          {isNew && (
            <>
              <Link href={`/${locale}/offers/new?instagramImportId=${item.id}`} className="flex-1 min-w-0">
                <Button size="sm" className="w-full gap-1.5 text-xs">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {t("createOffer")}
                </Button>
              </Link>
              <ConfirmDialog
                title={t("dismissConfirm")}
                description={t("dismissWarning")}
                variant="destructive"
                onConfirm={handleDismiss}
                trigger={
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs text-[hsl(var(--destructive))]">
                    <XCircle className="h-3.5 w-3.5" />
                    {t("dismiss")}
                  </Button>
                }
              />
            </>
          )}
          {item.status === "OFFER_CREATED" && item.offerId && (
            <Link href={`/${locale}/offers/${item.offerId}`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                {t("viewOffer")}
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
