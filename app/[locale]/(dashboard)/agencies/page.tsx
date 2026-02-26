"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, Building2, Eye } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

  const { data, isLoading } = useAgencies({ page, limit: 20 });
  const deleteAgency = useDeleteAgency();
  const agencies = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? (data?.total ? Math.ceil((data.total) / 20) : 1);

  async function handleDelete(id: string) {
    try {
      await deleteAgency.mutateAsync(id);
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
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">{t("subtitle")}</p>
        </div>
        <Link href={`/${locale}/agencies/new`}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t("create")}
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
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
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agencies.map((agency) => (
              <Card key={agency.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base truncate">
                        {agency.nameAr || agency.nameEn || agency.name || "—"}
                      </CardTitle>
                      {agency.nameEn && agency.nameAr && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))] truncate mt-0.5">
                          {agency.nameEn}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={agency.status} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {agency.contactEmail && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3 truncate" dir="ltr">
                      {agency.contactEmail}
                    </p>
                  )}
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">
                    {formatDate(agency.createdAt, locale)}
                  </p>
                  <div className="flex gap-2">
                    <Link href={`/${locale}/agencies/${agency.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                        <Eye className="h-3.5 w-3.5" />
                        {locale === "ar" ? "عرض" : "View"}
                      </Button>
                    </Link>
                    <Link href={`/${locale}/agencies/${agency.id}/edit`}>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <ConfirmDialog
                      title={t("deleteConfirm")}
                      description={t("deleteWarning")}
                      onConfirm={() => handleDelete(agency.id)}
                      trigger={
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))]">
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
