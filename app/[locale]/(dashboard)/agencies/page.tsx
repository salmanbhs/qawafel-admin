"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, Building2, X, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useAgencies, useDeleteAgency, useUpdateAgency } from "@/hooks/use-agencies";
import { formatDate } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api";

export default function AgenciesPage() {
  const t = useTranslations("agencies");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [searchNameInput, setSearchNameInput] = useState("");
  const [searchPhoneInput, setSearchPhoneInput] = useState("");
  const [searchInstagramInput, setSearchInstagramInput] = useState("");

  // Debounced search values
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchInstagram, setSearchInstagram] = useState("");

  // Debounce effect for name search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchName(searchNameInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchNameInput]);

  // Debounce effect for phone search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchPhone(searchPhoneInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchPhoneInput]);

  // Debounce effect for instagram search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchInstagram(searchInstagramInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInstagramInput]);

  const { data, isLoading } = useAgencies({
    page,
    limit: 20,
    ...(searchName && { search: searchName }),
    ...(searchPhone && { phone: searchPhone }),
    ...(searchInstagram && { instagram: searchInstagram }),
  });
  const deleteAgency = useDeleteAgency();
  const agencies = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  async function handleDelete(id: string) {
    try {
      await deleteAgency.mutateAsync(id);
      toast.success(t("deleteSuccess"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  const handleClearFilters = () => {
    setSearchNameInput("");
    setSearchPhoneInput("");
    setSearchInstagramInput("");
    setSearchName("");
    setSearchPhone("");
    setSearchInstagram("");
    setPage(1);
  };

  const hasActiveFilters = searchName || searchPhone || searchInstagram;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">{t("subtitle")}</p>
        </div>
        <Link href={`/${locale}/agencies/new`}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t("create")}
          </Button>
        </Link>
      </div>

      {/* Search Filters */}
      <div className="bg-[hsl(var(--muted)/0.3)] p-4 rounded-lg space-y-4">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Input
            placeholder={locale === "ar" ? "البحث بالاسم..." : "Search by name..."}
            value={searchNameInput}
            onChange={(e) => setSearchNameInput(e.target.value)}
          />
          <Input
            placeholder={locale === "ar" ? "البحث بالهاتف..." : "Search by phone..."}
            value={searchPhoneInput}
            onChange={(e) => setSearchPhoneInput(e.target.value)}
            dir="ltr"
          />
          <Input
            placeholder={locale === "ar" ? "البحث بـ Instagram..." : "Search by Instagram..."}
            value={searchInstagramInput}
            onChange={(e) => setSearchInstagramInput(e.target.value)}
            dir="ltr"
          />
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="gap-2"
            >
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
      ) : agencies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={tc("noResults")}
          description={locale === "ar" ? "لم يتم إنشاء أي وكالة بعد." : "No agencies created yet."}
          action={
            <Link href={`/${locale}/agencies/new`}>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {t("create")}
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{locale === "ar" ? "الاسم" : "Name"}</TableHead>
                  <TableHead>{locale === "ar" ? "إنستجرام" : "Instagram"}</TableHead>
                  <TableHead>{locale === "ar" ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{locale === "ar" ? "تاريخ الإنشاء" : "Created Date"}</TableHead>
                  <TableHead className="text-right">{locale === "ar" ? "الإجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agencies.map((agency) => (
                  <TableRow key={agency.id}>
                    <TableCell className="font-medium max-w-sm">
                      <div>
                        <div className="truncate">{agency.nameAr || agency.nameEn || agency.name || "—"}</div>
                        {agency.nameEn && agency.nameAr && (
                          <div className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                            {agency.nameEn}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm" dir="ltr">
                      {agency.instagramAccount ? (
                        <a
                          href={`https://instagram.com/${agency.instagramAccount.replace("@", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {agency.instagramAccount}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={agency.status} />
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(agency.createdAt, locale)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/${locale}/agencies/${agency.id}`}>
                          <Button variant="outline" size="sm" className="text-xs">
                            {locale === "ar" ? "عرض" : "View"}
                          </Button>
                        </Link>
                        <Link href={`/${locale}/agencies/${agency.id}/edit`}>
                          <Button variant="outline" size="sm" className="gap-1.5">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <ConfirmDialog
                          title={t("deleteConfirm")}
                          description={t("deleteWarning")}
                          onConfirm={() => handleDelete(agency.id)}
                          trigger={
                            <Button variant="outline" size="sm" className="gap-1.5 text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))]">
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
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
