"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, Hotel, Eye, Star, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { useHotels, useDeleteHotel } from "@/hooks/use-hotels";
import { useDestinations } from "@/hooks/use-destinations";
import { formatDate } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api";

export default function HotelsPage() {
  const t = useTranslations("hotels");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [destinationId, setDestinationId] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: destData } = useDestinations({ limit: 100 });
  const destinations = destData?.data ?? [];

  const { data, isLoading } = useHotels({
    page,
    limit: 20,
    ...(search && { search }),
    ...(destinationId && { destinationId }),
  });
  const deleteHotel = useDeleteHotel();
  const hotels = data?.data ?? [];
  const totalPages = data?.pagination?.pages ?? 1;

  async function handleDelete(id: string) {
    try {
      await deleteHotel.mutateAsync(id);
      toast.success(t("deleteSuccess"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  const hasActiveFilters = search || destinationId;

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setDestinationId("");
    setPage(1);
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

      {/* Filters */}
      <div className="bg-[hsl(var(--muted)/0.3)] p-4 rounded-lg">
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder={locale === "ar" ? "البحث بالاسم..." : "Search by name..."}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="max-w-xs"
          />
          <Select
            value={destinationId}
            onValueChange={(val) => {
              setDestinationId(val === "__all__" ? "" : val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder={locale === "ar" ? "كل الوجهات" : "All destinations"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">
                {locale === "ar" ? "كل الوجهات" : "All destinations"}
              </SelectItem>
              {destinations.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.nameAr || d.nameEn || d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="gap-2">
              <X className="h-4 w-4" />
              {locale === "ar" ? "مسح" : "Clear"}
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded" />
          ))}
        </div>
      ) : hotels.length === 0 ? (
        <EmptyState
          icon={Hotel}
          title={hasActiveFilters ? tc("noResults") : t("noHotels")}
          description={hasActiveFilters ? "" : t("noHotelsDesc")}
          action={
            !hasActiveFilters ? (
              <Link href={`/${locale}/hotels/new`}>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t("create")}
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("nameAr")}</TableHead>
                  <TableHead>{t("starRating")}</TableHead>
                  <TableHead>{t("destination")}</TableHead>
                  <TableHead>{t("agency")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{locale === "ar" ? "تاريخ الإنشاء" : "Created"}</TableHead>
                  <TableHead className="text-right">{locale === "ar" ? "الإجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hotels.map((hotel) => (
                  <TableRow key={hotel.id}>
                    <TableCell className="font-medium max-w-xs">
                      <div>
                        <div className="truncate">
                          {hotel.nameAr || hotel.nameEn || hotel.name || "—"}
                        </div>
                        {hotel.nameEn && hotel.nameAr && (
                          <div className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                            {hotel.nameEn}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {hotel.starRating ? (
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: hotel.starRating }).map((_, i) => (
                            <Star
                              key={i}
                              className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-[hsl(var(--muted-foreground))]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-[hsl(var(--muted-foreground))]">
                      {hotel.destination?.city || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-[hsl(var(--muted-foreground))] max-w-[160px]">
                      <div className="truncate">
                        {hotel.travelAgency
                          ? hotel.travelAgency.nameAr ||
                            hotel.travelAgency.nameEn ||
                            hotel.travelAgency.name ||
                            "—"
                          : "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={hotel.status} />
                    </TableCell>
                    <TableCell className="text-sm text-[hsl(var(--muted-foreground))]">
                      {formatDate(hotel.createdAt, locale)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/${locale}/hotels/${hotel.id}`}>
                          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                            <Eye className="h-3.5 w-3.5" />
                            {locale === "ar" ? "عرض" : "View"}
                          </Button>
                        </Link>
                        <Link href={`/${locale}/hotels/${hotel.id}/edit`}>
                          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      )}
    </div>
  );
}
