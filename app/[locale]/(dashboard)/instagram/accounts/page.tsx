"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Instagram, Trash2, Pencil, Eye } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  useMonitoredAccounts,
  useDeleteMonitoredAccount,
} from "@/hooks/use-instagram-import";
import { useReferenceAgencies } from "@/hooks/use-reference-data";
import { getApiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { MonitoredAccountDialog } from "@/components/instagram/MonitoredAccountDialog";

export default function MonitoredAccountsPage() {
  const t = useTranslations("instagram");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);

  const { data, isLoading } = useMonitoredAccounts({ page, limit: 20 });
  const deleteAccount = useDeleteMonitoredAccount();

  const accounts = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  async function handleDelete(id: string) {
    try {
      await deleteAccount.mutateAsync(id);
      toast.success(t("deleteSuccess"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("monitoredAccounts")}</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
            {t("monitoredAccountsSubtitle")}
          </p>
        </div>
        <Button className="gap-2" onClick={() => { setEditingAccount(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" />
          {t("addAccount")}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={Instagram}
          title={t("noAccounts")}
          description={t("noAccountsDesc")}
          action={
            <Button className="gap-2" onClick={() => { setEditingAccount(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4" />
              {t("addAccount")}
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <Card key={account.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base truncate flex items-center gap-2">
                        <Instagram className="h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
                        @{account.instagramUsername}
                      </CardTitle>
                      {account.travelAgency && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))] truncate mt-1">
                          {account.travelAgency.name || account.travelAgency.nameAr || account.travelAgency.nameEn}
                        </p>
                      )}
                    </div>
                    <Badge variant={account.isEnabled ? "success" : "secondary"}>
                      {account.isEnabled ? t("enabled") : t("disabled")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
                    <span>{t("pollingInterval")}</span>
                    <span>{account.pollingIntervalMinutes} min</span>
                  </div>
                  <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
                    <span>{t("lastPolled")}</span>
                    <span>
                      {account.lastPolledAt
                        ? formatDate(account.lastPolledAt, locale)
                        : t("never")}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
                    <span>{t("importCount")}</span>
                    <span>{account._count?.imports ?? 0}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 text-xs"
                      onClick={() => { setEditingAccount(account.id); setDialogOpen(true); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      {tc("edit")}
                    </Button>
                    <ConfirmDialog
                      title={t("deleteConfirm")}
                      description={t("deleteWarning")}
                      onConfirm={() => handleDelete(account.id)}
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
                </CardContent>
              </Card>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <MonitoredAccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        accountId={editingAccount}
      />
    </div>
  );
}
