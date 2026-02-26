"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useContactLogs } from "@/hooks/use-contact-logs";
import { formatDate } from "@/lib/utils";

export default function ContactLogsPage() {
  const t = useTranslations("contactLogs");
  const tc = useTranslations("common");
  const params = useParams<{ locale: string }>();
  const locale = params.locale;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useContactLogs({ page, limit: 20, search: search || undefined });
  const logs = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{t("contactLogs")}</h1>
        <p className="text-sm text-muted-foreground">{total} {tc("total")}</p>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={tc("search")}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="ps-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState icon={MessageSquare} title={t("noLogs")} description={t("noLogsDesc")} />
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Link
              key={log.id}
              href={`/${locale}/contact-logs/${log.id}`}
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-0.5">
                      <p className="font-medium">{log.senderName || log.senderEmail || tc("unknown")}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{log.message}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={log.status} />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(log.createdAt, locale)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
