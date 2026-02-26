"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { ClipboardList } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { useAuditLogs } from "@/hooks/use-admin";
import { formatDate } from "@/lib/utils";

export default function AuditLogsPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const params = useParams<{ locale: string }>();
  const locale = params.locale;
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAuditLogs({ page, limit: 25 });
  const logs = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 25);

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">{t("auditLogs")}</h1>
          <p className="text-sm text-muted-foreground">{total} {tc("total")}</p>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : logs.length === 0 ? (
          <EmptyState icon={ClipboardList} title={t("noAuditLogs")} />
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <Card key={log.id}>
                <CardContent className="py-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-mono text-xs">{log.action}</Badge>
                      <span className="text-sm text-muted-foreground">{log.entityType}</span>
                      {log.entityId && (
                        <span className="text-xs text-muted-foreground font-mono">#{log.entityId.slice(0, 8)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{log.adminEmail || log.adminId}</span>
                      <span>{formatDate(log.createdAt, locale)}</span>
                    </div>
                  </div>
                  {log.details && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {typeof log.details === "string" ? log.details : JSON.stringify(log.details)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </div>
    </AdminGuard>
  );
}
