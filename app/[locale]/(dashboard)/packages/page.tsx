"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, Globe, Eye, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { usePackages, useDeletePackage } from "@/hooks/use-packages";
import { useAuthStore } from "@/store/auth.store";
import { formatDate } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api";

export default function PackagesPage() {
  const t = useTranslations("packages");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "SYSTEM_ADMIN";

  const { data, isLoading } = usePackages({ page, limit: 20 });
  const deletePackage = useDeletePackage();
  const packages = data?.data ?? [];
  const totalPages =
    data?.meta?.totalPages ??
    (data?.total ? Math.ceil(data.total / 20) : 1);

  async function handleDelete(id: string) {
    try {
      await deletePackage.mutateAsync(id);
      toast.success(t("deleted"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  if (!isAdmin) {
    return (
      <EmptyState
        icon={Globe}
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
        <Link href={`/${locale}/packages/new`}>
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
      ) : packages.length === 0 ? (
        <EmptyState
          icon={Globe}
          title={t("noPackages")}
          description={t("noPackagesDesc")}
          action={
            <Link href={`/${locale}/packages/new`}>
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
            {packages.map((pkg) => (
              <Card key={pkg.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {pkg.iconImageUrl && (
                        <img
                          src={pkg.iconImageUrl}
                          alt={pkg.name || pkg.nameEn || ""}
                          className="w-10 h-10 rounded object-contain flex-shrink-0 border bg-muted"
                        />
                      )}
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">
                          {pkg.nameAr || pkg.nameEn || pkg.name || "—"}
                        </CardTitle>
                        {pkg.nameEn && pkg.nameAr && (
                          <p className="text-xs text-[hsl(var(--muted-foreground))] truncate mt-0.5">
                            {pkg.nameEn}
                          </p>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={pkg.status} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {pkg.isFeatured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium">
                          <Star className="h-3 w-3" />
                          {t("isFeatured")}
                        </span>
                      )}
                    </p>
                    <div className="flex gap-1">
                      <Link href={`/${locale}/packages/${pkg.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/${locale}/packages/${pkg.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <ConfirmDialog
                        title={t("deleteConfirmTitle")}
                        description={t("deleteConfirmDesc")}
                        onConfirm={() => handleDelete(pkg.id)}
                        trigger={
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
