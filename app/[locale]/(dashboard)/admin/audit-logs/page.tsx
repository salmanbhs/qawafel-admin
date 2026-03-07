"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import {
  ClipboardList, Search, X, ChevronDown, ChevronUp,
  User, Globe, Clock, AlertTriangle, Filter,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { useAuditLogs } from "@/hooks/use-admin";
import { formatDate, cn } from "@/lib/utils";
import type { AuditLog } from "@/types/api";

// ── helpers ──────────────────────────────────────────────────────────────────

function statusColor(code?: number | null): string {
  if (!code) return "bg-muted text-muted-foreground";
  if (code >= 500) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (code >= 400) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  if (code >= 300) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
}

function methodColor(method?: string | null): string {
  switch (method?.toUpperCase()) {
    case "GET":    return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400";
    case "POST":   return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "PATCH":
    case "PUT":    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "DELETE": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    default:       return "bg-muted text-muted-foreground";
  }
}

function actionColor(action: string): string {
  if (action.startsWith("DELETE") || action.startsWith("DEACTIVATE")) return "destructive";
  if (action.startsWith("CREATE") || action.startsWith("REGISTER") || action.startsWith("ACTIVATE")) return "default";
  if (action.startsWith("UPDATE") || action.startsWith("PATCH") || action.startsWith("RESTORE")) return "secondary";
  if (action === "LOGIN" || action === "LOGOUT" || action === "REFRESH_TOKEN") return "outline";
  return "outline";
}

function JsonBlock({ data }: { data: Record<string, unknown> | null | undefined }) {
  if (!data || Object.keys(data).length === 0) return null;
  return (
    <pre className="mt-1 rounded bg-muted px-3 py-2 text-xs font-mono overflow-x-auto max-h-40 whitespace-pre-wrap break-all">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function LogRow({ log, locale, t }: { log: AuditLog; locale: string; t: ReturnType<typeof useTranslations> }) {
  const [expanded, setExpanded] = useState(false);
  const isError = (log.statusCode ?? 0) >= 400;
  const hasDetails = log.changes || log.requestBody || log.errorMessage;

  return (
    <div className={cn(
      "rounded-lg border bg-card transition-colors",
      isError && "border-destructive/30"
    )}>
      {/* Main row */}
      <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">

        {/* Status code pill */}
        <span className={cn(
          "inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold tabular-nums shrink-0",
          statusColor(log.statusCode)
        )}>
          {log.statusCode ?? "—"}
        </span>

        {/* Method */}
        {log.method && (
          <span className={cn(
            "inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold shrink-0",
            methodColor(log.method)
          )}>
            {log.method}
          </span>
        )}

        {/* Action badge */}
        <Badge variant={actionColor(log.action) as any} className="shrink-0 font-mono text-xs">
          {log.action}
        </Badge>

        {/* Resource */}
        {(log.resourceType || log.entityType) && (
          <span className="text-xs text-muted-foreground shrink-0">
            {log.resourceType || log.entityType}
            {(log.resourceId || log.entityId) && (
              <span className="ml-1 font-mono opacity-60">
                #{(log.resourceId || log.entityId)!.slice(0, 8)}
              </span>
            )}
          </span>
        )}

        {/* Path */}
        {log.path && (
          <span className="text-xs font-mono text-muted-foreground truncate flex-1 min-w-0" title={log.path}>
            {log.path}
          </span>
        )}

        {/* Right side meta */}
        <div className="flex items-center gap-3 ms-auto shrink-0 text-xs text-muted-foreground">
          {log.duration != null && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {log.duration}ms
            </span>
          )}
          {(log.user || log.adminEmail) && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {log.user?.fullName || log.user?.email || log.adminEmail}
            </span>
          )}
          {log.ipAddress && (
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {log.ipAddress}
            </span>
          )}
          <span className="tabular-nums">{formatDate(log.createdAt, locale)}</span>

          {hasDetails && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Error message inline */}
      {isError && log.errorMessage && !expanded && (
        <div className="flex items-center gap-2 border-t px-4 py-2 text-xs text-destructive bg-destructive/5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {log.errorMessage}
          {log.errorCode && <span className="font-mono opacity-70">({log.errorCode})</span>}
        </div>
      )}

      {/* Expanded details */}
      {expanded && hasDetails && (
        <div className="border-t px-4 py-3 space-y-3 text-xs">
          {log.errorMessage && (
            <div>
              <p className="font-medium text-destructive flex items-center gap-1.5 mb-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {t("errorMessage")}
                {log.errorCode && <span className="font-mono text-muted-foreground">({log.errorCode})</span>}
              </p>
              <p className="text-destructive/80">{log.errorMessage}</p>
            </div>
          )}
          {log.changes && Object.keys(log.changes).length > 0 && (
            <div>
              <p className="font-medium text-muted-foreground mb-1">{t("changes")}</p>
              <JsonBlock data={log.changes} />
            </div>
          )}
          {log.requestBody && Object.keys(log.requestBody).length > 0 && (
            <div>
              <p className="font-medium text-muted-foreground mb-1">{t("requestBody")}</p>
              <JsonBlock data={log.requestBody} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

export default function AuditLogsPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const params = useParams<{ locale: string }>();
  const locale = params.locale;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // committed filter state (applied on explicit search)
  const [committed, setCommitted] = useState<{
    search: string; action: string; errorsOnly: boolean; startDate: string; endDate: string;
  }>({ search: "", action: "", errorsOnly: false, startDate: "", endDate: "" });

  const applyFilters = () => {
    setPage(1);
    setCommitted({ search, action, errorsOnly, startDate, endDate });
  };

  const clearFilters = () => {
    setSearch(""); setAction(""); setErrorsOnly(false); setStartDate(""); setEndDate("");
    setPage(1);
    setCommitted({ search: "", action: "", errorsOnly: false, startDate: "", endDate: "" });
  };

  const hasFilters = committed.search || committed.action || committed.errorsOnly || committed.startDate || committed.endDate;

  const { data, isLoading } = useAuditLogs({
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    ...(committed.search && { search: committed.search }),
    ...(committed.action && { action: committed.action }),
    ...(committed.errorsOnly && { minStatus: 400 }),
    ...(committed.startDate && { startDate: committed.startDate }),
    ...(committed.endDate && { endDate: committed.endDate }),
  });

  const logs = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AdminGuard>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t("auditLogs")}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {total.toLocaleString()} {tc("total")}
            </p>
          </div>
          {hasFilters && (
            <Badge variant="secondary" className="gap-1.5 self-start sm:self-auto">
              <Filter className="h-3 w-3" />
              {t("clearFilters")}
              <button onClick={clearFilters} className="ms-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder={t("search")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                  className="ps-8 h-8 text-sm"
                />
              </div>
              {/* Action */}
              <div className="flex-1 min-w-[160px]">
                <Input
                  placeholder={t("action")}
                  value={action}
                  onChange={(e) => setAction(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                  className="h-8 text-sm font-mono"
                />
              </div>
              {/* Date range */}
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 text-sm w-36"
                  title={t("startDate")}
                />
                <span className="text-muted-foreground text-xs">—</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 text-sm w-36"
                  title={t("endDate")}
                />
              </div>
              {/* Errors toggle */}
              <Button
                type="button"
                variant={errorsOnly ? "destructive" : "outline"}
                size="sm"
                onClick={() => setErrorsOnly((v) => !v)}
                className="h-8 gap-1.5"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {t("errorsOnly")}
              </Button>
              {/* Apply */}
              <Button type="button" size="sm" onClick={applyFilters} className="h-8">
                {t("search")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Log list */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <EmptyState icon={ClipboardList} title={t("noAuditLogs")} />
        ) : (
          <div className="space-y-1.5">
            {logs.map((log) => (
              <LogRow key={log.id} log={log} locale={locale} t={t} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        )}
      </div>
    </AdminGuard>
  );
}

