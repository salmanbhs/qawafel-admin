"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Instagram, Trash2, Pencil, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useMonitoredAccounts,
  useDeleteMonitoredAccount,
} from "@/hooks/use-instagram-import";
import { getApiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { MonitoredAccountDialog } from "@/components/instagram/MonitoredAccountDialog";

export default function MonitoredAccountsPage() {
  const t = useTranslations("instagram");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useMonitoredAccounts({
    page,
    limit: 20,
    ...(search && { search }),
  });
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

      {/* Search */}
      <div className="bg-[hsl(var(--muted)/0.3)] p-4 rounded-lg">
        <div className="flex gap-3">
          <Input
            placeholder={locale === "ar" ? "البحث..." : "Search..."}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="max-w-xs"
          />
          {searchInput && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchInput("");
                setSearch("");
                setPage(1);
              }}
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
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={Instagram}
          title={search ? tc("noResults") : t("noAccounts")}
          description={search ? "" : t("noAccountsDesc")}
          action={
            !search ? (
              <Button className="gap-2" onClick={() => { setEditingAccount(null); setDialogOpen(true); }}>
                <Plus className="h-4 w-4" />
                {t("addAccount")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{locale === "ar" ? "المستخدم" : "Username"}</TableHead>
                  <TableHead>{locale === "ar" ? "الوكالة" : "Travel Agency"}</TableHead>
                  <TableHead>{locale === "ar" ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{locale === "ar" ? "فترة الفحص" : "Polling Interval"}</TableHead>
                  <TableHead>{locale === "ar" ? "آخر فحص" : "Last Polled"}</TableHead>
                  <TableHead>{locale === "ar" ? "الواردات" : "Imports"}</TableHead>
                  <TableHead className="text-right">{locale === "ar" ? "الإجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Instagram className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                        @{account.instagramUsername}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[hsl(var(--muted-foreground))] max-w-xs">
                      <div className="truncate">
                        {account.travelAgency?.name || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={account.isEnabled ? "success" : "secondary"}>
                        {account.isEnabled ? t("enabled") : t("disabled")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {account.pollingIntervalMinutes} min
                    </TableCell>
                    <TableCell className="text-sm text-[hsl(var(--muted-foreground))]">
                      {account.lastPolledAt
                        ? formatDate(account.lastPolledAt, locale)
                        : t("never")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {account._count?.imports ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </div>
      )}

      <MonitoredAccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        accountId={editingAccount}
      />
    </div>
  );
}
