"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Building2, Package, MessageSquare, Plus, ArrowLeft, ArrowRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuthStore } from "@/store/auth.store";
import { useAgencies } from "@/hooks/use-agencies";
import { useContactLogs } from "@/hooks/use-contact-logs";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const locale = useLocale();
  const user = useAuthStore((s) => s.user);
  const isRtl = locale === "ar";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const { data: agenciesData, isLoading: agenciesLoading } = useAgencies({ page: 1, limit: 5 });
  const { data: logsData, isLoading: logsLoading } = useContactLogs({ page: 1, limit: 5 });

  const agencies = agenciesData?.data ?? [];
  const logs = logsData?.data ?? [];
  const totalAgencies = agenciesData?.meta?.total ?? agenciesData?.total ?? 0;
  const totalLogs = logsData?.meta?.total ?? logsData?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
            {t("welcome")} {user?.email}
          </p>
        </div>
        <Link href={`/${locale}/agencies/new`}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t("createAgency")}
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalAgencies")}</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            {agenciesLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">{totalAgencies}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("recentInquiries")}</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">{totalLogs}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Two-column content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Agencies table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">{t("totalAgencies")}</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {locale === "ar" ? "آخر وكالات تم إنشاؤها" : "Recently created agencies"}
              </CardDescription>
            </div>
            <Link href={`/${locale}/agencies`}>
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                {t("viewAll")} <ArrowIcon className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {agenciesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : agencies.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))] py-4 text-center">
                {tc("noResults")}
              </p>
            ) : (
              <div className="space-y-2">
                {agencies.map((agency) => (
                  <Link
                    key={agency.id}
                    href={`/${locale}/agencies/${agency.id}`}
                    className="flex items-center justify-between rounded-lg p-3 hover:bg-[hsl(var(--accent))] transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {agency.nameAr || agency.nameEn || agency.name || "-"}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {formatDate(agency.createdAt, locale)}
                      </p>
                    </div>
                    <StatusBadge status={agency.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent inquiries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">{t("recentInquiries")}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{t("recentInquiriesDesc")}</CardDescription>
            </div>
            <Link href={`/${locale}/contact-logs`}>
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                {t("viewAll")} <ArrowIcon className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {logsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))] py-4 text-center">
                {tc("noResults")}
              </p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <Link
                    key={log.id}
                    href={`/${locale}/contact-logs/${log.id}`}
                    className="flex items-center justify-between rounded-lg p-3 hover:bg-[hsl(var(--accent))] transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {log.phone || log.email || "—"}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                        {log.message?.slice(0, 50) || "—"}
                      </p>
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] shrink-0 ms-2">
                      {formatDate(log.createdAt, locale)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
